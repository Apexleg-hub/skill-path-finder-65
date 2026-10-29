-- COHORT PAYMENTS ADMIN: reporting views, metrics, and review resolution
--
-- Prerequisite: phase4_paystack_core.sql applied.
-- Adds (all new; changes no existing table):
--   1. cohort_payment_report   one row per registration with its payment and status
--   2. paystack_review_queue   payments held for review (wrong amount, duplicate, etc.)
--   3. cohort_payment_metrics  summary numbers for the dashboard (optionally for one cohort)
--   4. paystack_resolve_review the only way to settle a held payment, with an audit trail
-- The views obey the existing access rules (admins and owners only).

begin;

do $$
begin
  if to_regclass('public.paystack_payments') is null then
    raise exception 'Apply phase4_paystack_core.sql first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. One row per registration: who, what they owe, what is verified, and the latest attempt
-- ---------------------------------------------------------------------------
create or replace view public.cohort_payment_report with (security_invoker = true) as
select
  r.id as registration_id,
  r.registration_reference,
  r.full_name,
  r.email,
  r.phone,
  r.cohort_id,
  c.title as cohort_title,
  c.programme_name,
  r.amount_due,
  r.payment_status,
  r.registration_status,
  r.registered_at,
  pv.paid_amount,
  pv.paid_at,
  pv.payment_reference,
  case when pv.verified_count = 0 then null
       when pv.paystack_count > 0 then 'Paystack'
       else 'Bank transfer' end as payment_method,
  (select count(*) from public.paystack_payments a where a.registration_id = r.id) as attempts,
  la.status as last_attempt_status,
  la.created_at as last_attempt_at,
  exists (select 1 from public.paystack_payments a
          where a.registration_id = r.id and a.status = 'needs_review') as needs_review
from public.cohort_registrations r
join public.cohorts c on c.id = r.cohort_id
left join lateral (
  select sum(p.amount) as paid_amount,
         max(p.verified_at) as paid_at,
         max(p.payment_reference) as payment_reference,
         count(*) as verified_count,
         count(*) filter (where p.payment_reference like 'PSK-%') as paystack_count
  from public.cohort_payments p
  where p.registration_id = r.id and p.verification_status = 'verified'
) pv on true
left join lateral (
  select a.status, a.created_at
  from public.paystack_payments a
  where a.registration_id = r.id
  order by a.created_at desc
  limit 1
) la on true;

-- ---------------------------------------------------------------------------
-- 2. Payments held for review
-- ---------------------------------------------------------------------------
create or replace view public.paystack_review_queue with (security_invoker = true) as
select
  p.id,
  p.reference,
  p.amount_kobo as expected_kobo,
  nullif(p.provider_metadata ->> 'amount', '')::bigint as received_kobo,
  p.review_reason,
  p.channel,
  p.created_at,
  r.id as registration_id,
  r.registration_reference,
  r.full_name,
  r.email,
  r.amount_due,
  r.registration_status,
  r.payment_status,
  c.title as cohort_title
from public.paystack_payments p
join public.cohort_registrations r on r.id = p.registration_id
join public.cohorts c on c.id = p.cohort_id
where p.status = 'needs_review';

revoke all on public.cohort_payment_report, public.paystack_review_queue from anon;
grant select on public.cohort_payment_report, public.paystack_review_queue to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Dashboard numbers. Revenue comes only from VERIFIED payments, never from registrations.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_payment_metrics(p_cohort_id uuid default null)
returns table (
  total_registrations bigint,
  confirmed_students bigint,
  pending_payments bigint,
  successful_payments bigint,
  failed_payments bigint,
  held_for_review bigint,
  verified_revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.cohort_registrations r
       where r.registration_status <> 'cancelled' and (p_cohort_id is null or r.cohort_id = p_cohort_id)),
    (select count(*) from public.cohort_registrations r
       where r.registration_status = 'enrolled' and (p_cohort_id is null or r.cohort_id = p_cohort_id)),
    (select count(*) from public.cohort_registrations r
       where r.registration_status <> 'cancelled' and r.payment_status <> 'paid'
         and (p_cohort_id is null or r.cohort_id = p_cohort_id)),
    (select count(*) from public.cohort_payments cp
       join public.cohort_registrations r on r.id = cp.registration_id
       where cp.verification_status = 'verified' and (p_cohort_id is null or r.cohort_id = p_cohort_id)),
    (select count(*) from public.paystack_payments a
       where a.status in ('failed', 'abandoned') and (p_cohort_id is null or a.cohort_id = p_cohort_id)),
    (select count(*) from public.paystack_payments a
       where a.status = 'needs_review' and (p_cohort_id is null or a.cohort_id = p_cohort_id)),
    (select coalesce(sum(cp.amount), 0) from public.cohort_payments cp
       join public.cohort_registrations r on r.id = cp.registration_id
       where cp.verification_status = 'verified' and (p_cohort_id is null or r.cohort_id = p_cohort_id));
end;
$$;
revoke execute on function public.cohort_payment_metrics(uuid) from public, anon;
grant execute on function public.cohort_payment_metrics(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Settle a held payment. Only an owner can approve (after checking the money in Paystack);
--    an admin can dismiss. A written note is required, and every change is audited.
-- ---------------------------------------------------------------------------
create or replace function public.paystack_resolve_review(p_payment_id uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.paystack_payments%rowtype;
  reg public.cohort_registrations%rowtype;
  v_received bigint;
  v_verified numeric;
  v_note text := left(btrim(coalesce(p_note, '')), 300);
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if char_length(v_note) < 5 then
    raise exception 'Please write a note explaining your decision (at least 5 characters).' using errcode = 'P0001';
  end if;

  select * into pay from public.paystack_payments where id = p_payment_id for update;
  if not found or pay.status <> 'needs_review' then
    raise exception 'This payment is not waiting for review.' using errcode = 'P0001';
  end if;

  if not p_approve then
    update public.paystack_payments
    set status = 'failed',
        review_reason = left(coalesce(review_reason, '') || ' | Dismissed: ' || v_note, 500),
        updated_at = now()
    where id = pay.id;
    return;
  end if;

  if public.current_admin_role() <> 'owner' then
    raise exception 'Only the owner can approve a held payment.' using errcode = 'P0001';
  end if;

  select * into reg from public.cohort_registrations x where x.id = pay.registration_id for update;
  if reg.registration_status = 'cancelled' then
    raise exception 'Reinstate the registration before approving this payment.' using errcode = 'P0001';
  end if;

  v_received := coalesce(nullif(pay.provider_metadata ->> 'amount', '')::bigint, pay.amount_kobo);

  begin
    update public.paystack_payments
    set status = 'success',
        paid_at = coalesce(paid_at, now()),
        review_reason = left(coalesce(review_reason, '') || ' | Approved by owner: ' || v_note, 500),
        updated_at = now()
    where id = pay.id;
  exception when unique_violation then
    raise exception 'This registration already has a successful payment.' using errcode = 'P0001';
  end;

  perform set_config('app.payment_rpc', '1', true);

  insert into public.cohort_payments (registration_id, amount, payment_reference, payment_date, verification_status, verified_by, verified_at)
  values (reg.id, (v_received / 100.0)::numeric(12, 2), pay.reference,
          (now() at time zone 'Africa/Lagos')::date, 'verified', auth.uid(), now());

  select coalesce(sum(amount), 0) into v_verified
  from public.cohort_payments where registration_id = reg.id and verification_status = 'verified';

  update public.cohort_registrations
  set payment_status = case when v_verified >= reg.amount_due then 'paid' else 'partially_paid' end,
      registration_status = case when v_verified >= reg.amount_due and registration_status = 'registered'
                                 then 'enrolled' else registration_status end
  where id = reg.id;

  if v_verified >= reg.amount_due then
    if reg.application_id is not null then
      update public.lead_pipeline set status = 'enrolled'
      where application_id = reg.application_id and status <> 'enrolled';
    end if;
    insert into public.email_outbox (registration_id, kind, to_email)
    values (reg.id, 'payment_confirmed', reg.email)
    on conflict do nothing;
  end if;

  perform set_config('app.payment_rpc', '', true);
end;
$$;
revoke execute on function public.paystack_resolve_review(uuid, boolean, text) from public, anon;
grant execute on function public.paystack_resolve_review(uuid, boolean, text) to authenticated;

commit;
