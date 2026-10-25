-- PHASE 3: Course payments, payment verification hardening, cohort admin support
--
-- Prerequisites: phase1_admin_foundation.sql and phase2_leads_crm.sql applied.
--
-- What this adds (all NEW unless marked):
--   1. student_payments        course payments, entered as PENDING, verified only by an admin
--   2. lead_pipeline.tuition_amount   (new column on a Phase 2 table) agreed tuition, admin-only
--   3. verify_student_payment()       the only way a course payment becomes verified or rejected
--   4. Hardening of the cohort payment flow (REPLACES three Phase 1 / cohort functions and adds
--      guard triggers) so a payment or enrolment status can only change through verification
--   5. save_cohort_curriculum()       saves a cohort's modules in one atomic step
--   6. log_data_export()              records CSV exports in the audit log
--   7. Views for the dashboard, and an image bucket for cohort pictures
-- It does not touch course_applications or any Phase 0 table.

begin;

do $$
begin
  if to_regclass('public.lead_pipeline') is null or to_regclass('public.cohort_payments') is null then
    raise exception 'Apply the cohort migration, phase1 and phase2 first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Agreed tuition per lead (only admins may set it) + updated lead guard
-- ---------------------------------------------------------------------------
alter table public.lead_pipeline
  add column if not exists tuition_amount numeric(12,2)
  check (tuition_amount is null or (tuition_amount >= 0 and tuition_amount <= 100000000));

create or replace function public.lead_pipeline_guard()
returns trigger
language plpgsql
as $$
begin
  new.application_id := old.application_id;
  new.created_at := old.created_at;
  new.opt_out_token := old.opt_out_token;
  new.updated_at := now();
  new.updated_by := auth.uid();

  if new.tuition_amount is distinct from old.tuition_amount
     and not public.has_admin_role('admin') then
    raise exception 'Only admins can set the agreed tuition.' using errcode = 'P0001';
  end if;

  if new.follow_up_date is distinct from old.follow_up_date
     and new.follow_up_date is not null
     and new.follow_up_date < public.lagos_today() then
    raise exception 'The follow-up date cannot be in the past.' using errcode = 'P0001';
  end if;

  if new.status = 'contacted' and old.status is distinct from 'contacted' then
    new.contacted_at := coalesce(new.contacted_at, now());
    new.contacted_by := auth.uid();
  end if;

  if new.status in ('enrolled', 'not_interested') then
    new.follow_up_date := null;
  end if;

  if old.marketing_consent = 'declined' and new.marketing_consent <> 'declined' then
    raise exception 'A recorded opt-out cannot be reversed.' using errcode = 'P0001';
  end if;
  if new.marketing_consent = 'declined' and old.marketing_consent is distinct from 'declined' then
    new.opted_out_at := now();
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. student_payments
--    A payment is ALWAYS entered as pending. Nobody can insert or edit it as verified.
-- ---------------------------------------------------------------------------
create table if not exists public.student_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.course_applications (id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0 and amount <= 100000000),
  currency text not null default 'NGN' check (currency in ('NGN', 'USD')),
  payment_reference text not null check (char_length(btrim(payment_reference)) between 3 and 100),
  payment_method text not null check (payment_method in ('bank_transfer', 'cash', 'pos', 'cheque', 'other')),
  payment_date date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  rejection_reason text check (char_length(rejection_reason) <= 500),
  entered_by uuid not null default auth.uid() references auth.users (id),
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists student_payments_app_idx on public.student_payments (application_id);
create index if not exists student_payments_status_idx on public.student_payments (verification_status, created_at desc);

-- The same reference cannot be recorded twice for one student, unless the earlier one was rejected.
create unique index if not exists student_payments_unique_ref
  on public.student_payments (application_id, lower(btrim(payment_reference)))
  where verification_status <> 'rejected';

create or replace function public.student_payments_insert_guard()
returns trigger
language plpgsql
as $$
begin
  new.verification_status := 'pending';
  new.verified_by := null;
  new.verified_at := null;
  new.rejection_reason := null;
  if new.payment_date is not null and new.payment_date > public.lagos_today() then
    raise exception 'The payment date cannot be in the future.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger student_payments_insert_guard_trg
  before insert on public.student_payments
  for each row execute function public.student_payments_insert_guard();

alter table public.student_payments enable row level security;
revoke all on public.student_payments from anon;
revoke update, delete, truncate on public.student_payments from authenticated;   -- verification goes through the function only

create policy student_payments_staff_read on public.student_payments
  for select to authenticated using (public.has_admin_role('staff'));
create policy student_payments_staff_insert on public.student_payments
  for insert to authenticated
  with check (public.has_admin_role('staff') and entered_by = auth.uid());

create trigger audit_student_payments
  after insert or update or delete on public.student_payments
  for each row execute function public.audit_row_change(
    'application_id', 'amount', 'currency', 'payment_method', 'verification_status', 'verified_by');

-- ---------------------------------------------------------------------------
-- 3. Verify or reject a course payment (admin or owner only)
-- ---------------------------------------------------------------------------
create or replace function public.verify_student_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.student_payments%rowtype;
  v_tuition numeric;
  v_total numeric;
begin
  if not public.has_admin_role('admin') then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  select * into p from public.student_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found.' using errcode = 'P0001';
  end if;
  if p.verification_status <> 'pending' then
    raise exception 'This payment has already been % and cannot be changed.', p.verification_status
      using errcode = 'P0001';
  end if;
  -- Separation of duties: only the owner may verify a payment they entered themselves.
  if p.entered_by = auth.uid() and public.current_admin_role() <> 'owner' then
    raise exception 'You cannot verify a payment you entered yourself.' using errcode = 'P0001';
  end if;
  if not p_approve and (p_reason is null or char_length(btrim(p_reason)) < 3) then
    raise exception 'Please give a reason for rejecting this payment.' using errcode = 'P0001';
  end if;

  update public.student_payments
  set verification_status = case when p_approve then 'verified' else 'rejected' end,
      verified_by = auth.uid(),
      verified_at = now(),
      rejection_reason = case when p_approve then null else left(btrim(p_reason), 500) end
  where id = p.id;

  -- Enrolment follows verified money: only when an agreed tuition is on file and fully covered.
  if p_approve then
    select tuition_amount into v_tuition
    from public.lead_pipeline where application_id = p.application_id for update;
    select coalesce(sum(amount), 0) into v_total
    from public.student_payments
    where application_id = p.application_id and verification_status = 'verified' and currency = 'NGN';
    if v_tuition is not null and v_tuition > 0 and v_total >= v_tuition then
      update public.lead_pipeline set status = 'enrolled'
      where application_id = p.application_id and status <> 'enrolled';
    end if;
  end if;
end;
$$;
revoke execute on function public.verify_student_payment(uuid, boolean, text) from public, anon;
grant execute on function public.verify_student_payment(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Hardening the COHORT payment flow
--    Payment and enrolment status may only change inside the verification functions, which set
--    a transaction-local flag. Direct edits (even by an admin) are refused.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_payments_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.verification_status := 'submitted';
    new.verified_by := null;
    new.verified_at := null;
    return new;
  end if;
  if coalesce(current_setting('app.payment_rpc', true), '') <> '1'
     and (new.verification_status is distinct from old.verification_status
          or new.verified_by is distinct from old.verified_by
          or new.verified_at is distinct from old.verified_at
          or new.amount is distinct from old.amount
          or new.registration_id is distinct from old.registration_id) then
    raise exception 'Payment status can only be changed by verifying the payment.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists cohort_payments_guard_trg on public.cohort_payments;
create trigger cohort_payments_guard_trg
  before insert or update on public.cohort_payments
  for each row execute function public.cohort_payments_guard();

create or replace function public.cohort_registrations_guard()
returns trigger
language plpgsql
as $$
declare via_rpc boolean := coalesce(current_setting('app.payment_rpc', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    if not via_rpc and (new.payment_status <> 'pending' or new.registration_status <> 'registered') then
      raise exception 'A registration must start as registered and pending payment.' using errcode = 'P0001';
    end if;
    return new;
  end if;
  if not via_rpc and (
       new.payment_status is distinct from old.payment_status
       or new.amount_due is distinct from old.amount_due
       or new.early_bird_applied is distinct from old.early_bird_applied
       or new.cohort_id is distinct from old.cohort_id
       or new.registration_reference is distinct from old.registration_reference
       or (new.registration_status = 'enrolled' and old.registration_status is distinct from 'enrolled')) then
    raise exception 'Payment and enrolment status change only by verifying a payment.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists cohort_registrations_guard_trg on public.cohort_registrations;
create trigger cohort_registrations_guard_trg
  before insert or update on public.cohort_registrations
  for each row execute function public.cohort_registrations_guard();

-- REPLACED: same behaviour as before, plus the flag, and a payment can only be decided once.
create or replace function public.verify_cohort_payment(p_payment_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg uuid;
  v_status text;
  v_due numeric;
  v_verified numeric;
  v_pending integer;
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  select registration_id, verification_status into v_reg, v_status
  from public.cohort_payments where id = p_payment_id for update;
  if v_reg is null then
    raise exception 'Payment not found.' using errcode = 'P0001';
  end if;
  if v_status <> 'submitted' then
    raise exception 'This payment has already been % and cannot be changed.', v_status using errcode = 'P0001';
  end if;

  perform set_config('app.payment_rpc', '1', true);

  update public.cohort_payments
  set verification_status = case when p_approve then 'verified' else 'rejected' end,
      verified_by = auth.uid(),
      verified_at = now()
  where id = p_payment_id;

  select amount_due into v_due from public.cohort_registrations where id = v_reg for update;
  select coalesce(sum(amount), 0) into v_verified
    from public.cohort_payments where registration_id = v_reg and verification_status = 'verified';
  select count(*) into v_pending
    from public.cohort_payments where registration_id = v_reg and verification_status = 'submitted';

  update public.cohort_registrations
  set payment_status = case
        when v_verified >= v_due and v_due > 0 then 'paid'
        when v_verified > 0 then 'partially_paid'
        when v_pending > 0 then 'submitted'
        when not p_approve then 'rejected'
        else 'pending' end,
      registration_status = case
        when v_verified >= v_due and v_due > 0 and registration_status = 'registered' then 'enrolled'
        else registration_status end
  where id = v_reg;

  perform set_config('app.payment_rpc', '', true);
end;
$$;

-- REPLACED: same behaviour as before, plus the flag so the guard allows its status update.
create or replace function public.submit_cohort_payment(
  p_registration_reference text,
  p_email text,
  p_amount numeric,
  p_payment_reference text,
  p_payment_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.cohort_registrations%rowtype;
begin
  select * into r
  from public.cohort_registrations
  where registration_reference = upper(trim(p_registration_reference))
    and lower(email) = lower(trim(p_email))
    and registration_status <> 'cancelled';

  if not found then
    raise exception 'We could not find a registration matching those details.' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Please enter the amount you paid.' using errcode = 'P0001';
  end if;
  if p_payment_reference is null or char_length(trim(p_payment_reference)) < 3 then
    raise exception 'Please enter your payment reference.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.cohort_payments where registration_id = r.id) >= 10 then
    raise exception 'Too many payment submissions. Please contact support.' using errcode = 'P0001';
  end if;

  insert into public.cohort_payments (registration_id, amount, payment_reference, payment_date)
  values (r.id, p_amount, trim(p_payment_reference), p_payment_date);

  if r.payment_status in ('pending', 'rejected') then
    perform set_config('app.payment_rpc', '1', true);
    update public.cohort_registrations set payment_status = 'submitted' where id = r.id;
    perform set_config('app.payment_rpc', '', true);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Save a cohort's curriculum atomically (replaces its modules in one step)
-- ---------------------------------------------------------------------------
create or replace function public.save_cohort_curriculum(p_cohort_id uuid, p_modules jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb;
  i integer := 0;
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if p_modules is null or jsonb_typeof(p_modules) <> 'array' then
    raise exception 'Invalid curriculum.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_modules) > 60 then
    raise exception 'A cohort can have at most 60 modules.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.cohorts where id = p_cohort_id) then
    raise exception 'Cohort not found.' using errcode = 'P0001';
  end if;

  delete from public.cohort_curriculum where cohort_id = p_cohort_id;

  for m in select * from jsonb_array_elements(p_modules) loop
    i := i + 1;
    if coalesce(btrim(m ->> 'module_title'), '') = '' then
      raise exception 'Every module needs a title.' using errcode = 'P0001';
    end if;
    insert into public.cohort_curriculum
      (cohort_id, week_number, module_title, module_description, topics, objectives, assignment, display_order)
    values (
      p_cohort_id,
      greatest(coalesce((m ->> 'week_number')::integer, i), 1),
      left(btrim(m ->> 'module_title'), 200),
      nullif(left(btrim(coalesce(m ->> 'module_description', '')), 2000), ''),
      coalesce(array(select left(btrim(t), 300)
                     from jsonb_array_elements_text(coalesce(m -> 'topics', '[]'::jsonb)) as t
                     where btrim(t) <> ''), '{}'),
      coalesce(array(select left(btrim(t), 300)
                     from jsonb_array_elements_text(coalesce(m -> 'objectives', '[]'::jsonb)) as t
                     where btrim(t) <> ''), '{}'),
      nullif(left(btrim(coalesce(m ->> 'assignment', '')), 1000), ''),
      i
    );
  end loop;
end;
$$;
revoke execute on function public.save_cohort_curriculum(uuid, jsonb) from public, anon;
grant execute on function public.save_cohort_curriculum(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Record data exports (who exported what, how many rows). No personal data is stored.
-- ---------------------------------------------------------------------------
create or replace function public.log_data_export(p_table text, p_row_count integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role('admin') then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if p_table not in ('cohort_registrations', 'lead_pipeline', 'student_payments') then
    raise exception 'Unknown export.' using errcode = 'P0001';
  end if;
  insert into public.audit_logs (actor_id, actor_role, action, table_name, new_values)
  values (auth.uid(), public.current_admin_role(), 'EXPORT', p_table,
          jsonb_build_object('rows', greatest(coalesce(p_row_count, 0), 0)));
end;
$$;
revoke execute on function public.log_data_export(text, integer) from public, anon;
grant execute on function public.log_data_export(text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Views for the dashboard (security_invoker: they obey the table policies above)
-- ---------------------------------------------------------------------------
create or replace view public.payment_queue with (security_invoker = true) as
select
  p.id, p.application_id, a.full_name, a.email, a.course,
  p.amount, p.currency, p.payment_reference, p.payment_method, p.payment_date,
  p.verification_status, p.rejection_reason, p.entered_by, p.verified_by, p.verified_at, p.created_at,
  l.tuition_amount
from public.student_payments p
join public.course_applications a on a.id = p.application_id
join public.lead_pipeline l on l.application_id = p.application_id;

create or replace view public.lead_payment_summary with (security_invoker = true) as
select
  l.application_id,
  l.tuition_amount,
  coalesce(sum(p.amount) filter (where p.verification_status = 'verified' and p.currency = 'NGN'), 0) as verified_total,
  coalesce(sum(p.amount) filter (where p.verification_status = 'pending' and p.currency = 'NGN'), 0) as pending_total,
  case when l.tuition_amount is null then null
       else greatest(l.tuition_amount
            - coalesce(sum(p.amount) filter (where p.verification_status = 'verified' and p.currency = 'NGN'), 0), 0)
  end as outstanding
from public.lead_pipeline l
left join public.student_payments p on p.application_id = l.application_id
group by l.application_id, l.tuition_amount;

create or replace view public.cohort_admin_summary with (security_invoker = true) as
select
  c.id as cohort_id,
  count(r.id) filter (where r.registration_status <> 'cancelled') as registrations,
  count(r.id) filter (where r.payment_status = 'paid') as paid,
  coalesce((select sum(p.amount)
            from public.cohort_payments p
            join public.cohort_registrations rr on rr.id = p.registration_id
            where rr.cohort_id = c.id and p.verification_status = 'verified'), 0) as verified_revenue
from public.cohorts c
left join public.cohort_registrations r on r.cohort_id = c.id
group by c.id;

revoke all on public.payment_queue, public.lead_payment_summary, public.cohort_admin_summary from anon;
grant select on public.payment_queue, public.lead_payment_summary, public.cohort_admin_summary to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Image bucket for cohort pictures (public to read, admins only to change)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cohort-images', 'cohort-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists cohort_images_public_read on storage.objects;
drop policy if exists cohort_images_admin_insert on storage.objects;
drop policy if exists cohort_images_admin_update on storage.objects;
drop policy if exists cohort_images_admin_delete on storage.objects;

create policy cohort_images_public_read on storage.objects
  for select using (bucket_id = 'cohort-images');
create policy cohort_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'cohort-images' and public.is_cohort_admin());
create policy cohort_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'cohort-images' and public.is_cohort_admin())
  with check (bucket_id = 'cohort-images' and public.is_cohort_admin());
create policy cohort_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'cohort-images' and public.is_cohort_admin());

commit;

-- NOTE for manual fixes in the SQL editor: the guards above also apply to you. To correct a
-- cohort payment or registration status by hand, run this first in the same transaction:
--   select set_config('app.payment_rpc', '1', true);
