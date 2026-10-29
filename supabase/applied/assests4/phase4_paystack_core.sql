-- PAYSTACK STEP 1: database foundation
--
-- Prerequisites: the cohort migration, phase1, phase2 and phase3 are applied, and
-- fix_register_for_cohort.sql has been run.
--
-- What this does:
--   1. cohorts: adds payment_deadline and seat_hold_hours.
--   2. cohort_registrations: adds pay_token (a private link token), application_id (the linked
--      lead) and seat_held_until (how long an unpaid registration keeps its seat).
--   3. New tables: paystack_payments (every payment attempt, in kobo), payment_events (webhook
--      log) and email_outbox (emails to send, once each).
--   4. paystack_confirm_charge(): the ONE function that confirms a payment. The verify endpoint
--      and the webhook both call it. It is safe to call twice.
--   5. paystack_prepare_attempt(): creates a payment attempt with the tuition read from the
--      database, never from the browser.
--   6. REPLACES register_for_cohort (new return column, seat holds, lead creation, email queue),
--      cohort_seats_remaining, and the two guard triggers from phase 3.
--   7. get_payment_status() and resume_cohort_registration(): token-based lookups for students.
--
-- Existing registrations keep their seats (no hold date means held until cancelled), so nothing
-- changes for students who registered before this migration.

begin;

do $$
begin
  if to_regprocedure('public.verify_cohort_payment(uuid, boolean)') is null
     or to_regclass('public.lead_pipeline') is null
     or to_regprocedure('public.audit_row_change()') is null then
    raise exception 'Apply the cohort migration, phase1, phase2 and phase3 first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Cohort settings
-- ---------------------------------------------------------------------------
alter table public.cohorts
  add column if not exists payment_deadline date,
  add column if not exists seat_hold_hours integer not null default 48
    check (seat_hold_hours between 1 and 720);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cohorts_payment_deadline_check') then
    alter table public.cohorts add constraint cohorts_payment_deadline_check
      check (payment_deadline is null or registration_deadline is null or payment_deadline >= registration_deadline);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Registration additions
-- ---------------------------------------------------------------------------
alter table public.cohort_registrations
  add column if not exists pay_token uuid not null default gen_random_uuid(),
  add column if not exists application_id uuid references public.course_applications (id) on delete set null,
  add column if not exists seat_held_until timestamptz;

create unique index if not exists cohort_registrations_pay_token_idx on public.cohort_registrations (pay_token);
create index if not exists cohort_registrations_application_idx on public.cohort_registrations (application_id);

-- ---------------------------------------------------------------------------
-- 3. New tables (closed to the public; written only by the functions below and the Edge Functions)
-- ---------------------------------------------------------------------------
create table if not exists public.paystack_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.cohort_registrations (id) on delete restrict,
  cohort_id uuid not null references public.cohorts (id) on delete restrict,
  reference text not null unique,
  paystack_transaction_id bigint unique,
  access_code text,
  amount_kobo bigint not null check (amount_kobo > 0),          -- snapshot of the tuition at attempt time
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'initialized'
    check (status in ('initialized', 'pending', 'success', 'failed', 'abandoned', 'needs_review')),
  review_reason text,
  channel text,
  gateway_response text,
  provider_metadata jsonb,
  initiated_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paystack_payments_reg_idx on public.paystack_payments (registration_id, created_at desc);
create index if not exists paystack_payments_status_idx on public.paystack_payments (status, created_at desc);
-- A registration can have at most one successful payment.
create unique index if not exists paystack_one_success_per_registration
  on public.paystack_payments (registration_id) where status = 'success';

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  event text,
  reference text,
  signature_valid boolean not null,
  result text,
  payload jsonb
);
create index if not exists payment_events_ref_idx on public.payment_events (reference);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.cohort_registrations (id) on delete cascade,
  kind text not null check (kind in ('registration_received', 'payment_confirmed')),
  to_email text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (registration_id, kind)                                  -- each email is queued once
);
create index if not exists email_outbox_status_idx on public.email_outbox (status, created_at);

alter table public.paystack_payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.email_outbox enable row level security;

revoke all on public.paystack_payments, public.payment_events, public.email_outbox from anon;
revoke insert, update, delete, truncate on public.paystack_payments, public.payment_events, public.email_outbox
  from authenticated;

create policy paystack_payments_admin_read on public.paystack_payments
  for select to authenticated using (public.is_cohort_admin());
create policy payment_events_admin_read on public.payment_events
  for select to authenticated using (public.is_cohort_admin());
create policy email_outbox_admin_read on public.email_outbox
  for select to authenticated using (public.is_cohort_admin());

create trigger audit_paystack_payments
  after insert or update or delete on public.paystack_payments
  for each row execute function public.audit_row_change(
    'registration_id', 'amount_kobo', 'status', 'review_reason');

-- ---------------------------------------------------------------------------
-- 4. Guard triggers (REPLACED from phase 3)
--    Verified payments and enrolment may only be written by the confirmation functions, which set
--    a transaction-local flag. pay_token can never be changed.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_payments_guard()
returns trigger
language plpgsql
as $$
declare via_rpc boolean := coalesce(current_setting('app.payment_rpc', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    if not via_rpc then
      new.verification_status := 'submitted';
      new.verified_by := null;
      new.verified_at := null;
    end if;
    return new;
  end if;
  if not via_rpc
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
       or new.pay_token is distinct from old.pay_token
       or (new.registration_status = 'enrolled' and old.registration_status is distinct from 'enrolled')) then
    raise exception 'Payment and enrolment status change only by verifying a payment.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Seats: unpaid registrations hold a seat only until seat_held_until
-- ---------------------------------------------------------------------------
create or replace function public.cohort_seats_taken(p_cohort_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.cohort_registrations r
  where r.cohort_id = p_cohort_id
    and r.registration_status <> 'cancelled'
    and (r.registration_status = 'enrolled'
         or r.payment_status in ('paid', 'submitted', 'partially_paid')
         or coalesce(r.seat_held_until, 'infinity'::timestamptz) > now());   -- null = older registration, held
$$;

create or replace function public.cohort_seats_remaining(p_cohort_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case when c.seat_capacity is null then null
              else greatest(c.seat_capacity - public.cohort_seats_taken(c.id), 0)::integer end
  from public.cohorts c
  where c.id = p_cohort_id and c.publication_status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- 6. register_for_cohort (REPLACED): same rules as before, plus
--    - a private pay_token in the result
--    - seat hold with an expiry
--    - a linked lead in course_applications (never allowed to make registration fail)
--    - a queued "registration received" email
-- ---------------------------------------------------------------------------
drop function if exists public.register_for_cohort(text, text, text, text, text, text, text, boolean, text);

create function public.register_for_cohort(
  p_slug text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_experience_level text,
  p_learning_goal text,
  p_payment_option text,
  p_consent boolean,
  p_website text default null          -- honeypot: real users leave this empty
)
returns table (
  registration_reference text,
  amount_due numeric,
  early_bird_applied boolean,
  pay_token uuid,
  bank_name text,
  account_name text,
  account_number text,
  instructions text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.cohorts%rowtype;
  v_email text := lower(trim(p_email));
  v_today date := public.lagos_today();
  v_fee numeric;
  v_early boolean := false;
  v_ref text;
  v_reg_id uuid;
  v_token uuid;
  v_app uuid;
  v_hold timestamptz;
  v_try integer := 0;
begin
  if p_website is not null and length(p_website) > 0 then
    raise exception 'Registration could not be completed.' using errcode = 'P0001';
  end if;
  if coalesce(p_consent, false) is not true then
    raise exception 'You must accept the privacy policy to register.' using errcode = 'P0001';
  end if;
  if p_full_name is null or char_length(trim(p_full_name)) < 2 then
    raise exception 'Please enter your full name.' using errcode = 'P0001';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address.' using errcode = 'P0001';
  end if;
  if p_phone is null or p_phone !~ '^\+?[0-9\s\-]{7,20}$' then
    raise exception 'Please enter a valid WhatsApp phone number.' using errcode = 'P0001';
  end if;
  if p_experience_level not in ('beginner', 'intermediate', 'advanced') then
    raise exception 'Please select your experience level.' using errcode = 'P0001';
  end if;

  select * into c
  from public.cohorts
  where slug = p_slug and publication_status = 'published'
  for update;                                  -- serialises registrations per cohort

  if not found then
    raise exception 'This cohort is not available.' using errcode = 'P0001';
  end if;

  if c.cohort_status <> 'open'
     or c.registration_deadline < v_today
     or (c.end_date is not null and c.end_date < v_today) then
    raise exception 'Registration for this cohort is closed.' using errcode = 'P0001';
  end if;

  if c.seat_capacity is not null and public.cohort_seats_taken(c.id) >= c.seat_capacity then
    raise exception 'This cohort is full.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.cohort_registrations x
    where x.cohort_id = c.id and lower(x.email) = v_email
  ) then
    raise exception 'This email is already registered for this cohort. To continue a registration you have not paid for, use "Continue my registration" with your reference.'
      using errcode = 'P0001';
  end if;

  if p_payment_option is not null and cardinality(c.payment_options) > 0
     and not (p_payment_option = any (c.payment_options)) then
    raise exception 'Please choose a valid payment option.' using errcode = 'P0001';
  end if;

  -- Early-bird eligibility is decided here, on the server, never by the browser.
  if c.early_bird_fee is not null and c.early_bird_deadline is not null
     and c.early_bird_deadline >= v_today then
    v_fee := c.early_bird_fee;
    v_early := true;
  else
    v_fee := coalesce(c.tuition_fee, 0);
  end if;

  -- An unpaid registration holds its seat for seat_hold_hours, or until the payment deadline.
  v_hold := least(
    now() + make_interval(hours => c.seat_hold_hours),
    ((coalesce(c.payment_deadline, c.registration_deadline) + 1)::timestamp at time zone 'Africa/Lagos')
  );

  loop
    v_ref := 'CPT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.cohort_registrations (
        cohort_id, full_name, email, phone, experience_level, learning_goal,
        payment_option, registration_reference, amount_due, early_bird_applied, consent_given,
        seat_held_until
      ) values (
        c.id, trim(p_full_name), v_email, trim(p_phone), p_experience_level,
        nullif(trim(p_learning_goal), ''), p_payment_option, v_ref, v_fee, v_early, true,
        v_hold
      )
      returning cohort_registrations.id, cohort_registrations.pay_token into v_reg_id, v_token;
      exit;
    exception
      when unique_violation then
        if exists (select 1 from public.cohort_registrations x
                   where x.cohort_id = c.id and lower(x.email) = v_email) then
          raise exception 'This email is already registered for this cohort.' using errcode = 'P0001';
        end if;
        v_try := v_try + 1;
        if v_try > 5 then raise; end if;
    end;
  end loop;

  -- Keep the person as a lead for follow-up, whether or not they pay. This must never block
  -- registration, so any failure is swallowed.
  begin
    insert into public.course_applications (full_name, email, phone, course, learning_format, message, experience_level, source)
    values (trim(p_full_name), v_email, trim(p_phone), c.title, c.learning_format,
            nullif(trim(p_learning_goal), ''), p_experience_level, 'cohort:' || c.slug)
    returning id into v_app;
    update public.cohort_registrations set application_id = v_app where id = v_reg_id;
  exception when others then
    raise warning 'cohort lead creation failed: %', sqlerrm;
  end;

  insert into public.email_outbox (registration_id, kind, to_email)
  values (v_reg_id, 'registration_received', v_email)
  on conflict do nothing;

  return query
    select v_ref, v_fee, v_early, v_token, a.bank_name, a.account_name, a.account_number, a.instructions
    from (select 1) x
    left join lateral (
      select * from public.cohort_payment_accounts
      where is_active order by created_at desc limit 1
    ) a on true;
end;
$$;

revoke all on function public.register_for_cohort(text, text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.register_for_cohort(text, text, text, text, text, text, text, boolean, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Create a payment attempt (called only by the Edge Function, with the service role)
--    Validates the registration, checks seats and deadlines, rate-limits, and stores the
--    tuition snapshot in kobo. The browser never supplies an amount.
-- ---------------------------------------------------------------------------
create or replace function public.paystack_prepare_attempt(p_pay_token uuid, p_reference text)
returns table (
  o_payment_id uuid,
  o_registration_id uuid,
  o_email text,
  o_full_name text,
  o_amount_kobo bigint,
  o_cohort_title text,
  o_cohort_slug text,
  o_registration_reference text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.cohort_registrations%rowtype;
  c public.cohorts%rowtype;
  v_today date := public.lagos_today();
  v_deadline date;
  v_kobo bigint;
  v_pid uuid;
begin
  if p_reference is null or char_length(p_reference) < 8 or char_length(p_reference) > 100 then
    raise exception 'Invalid payment reference.' using errcode = 'P0001';
  end if;

  select * into r from public.cohort_registrations x where x.pay_token = p_pay_token;
  if not found then
    raise exception 'We could not find this registration.' using errcode = 'P0001';
  end if;

  -- Lock order: cohort, then registration (matches register_for_cohort).
  select * into c from public.cohorts where id = r.cohort_id and publication_status = 'published' for update;
  if not found then
    raise exception 'This cohort is not available.' using errcode = 'P0001';
  end if;
  select * into r from public.cohort_registrations x where x.id = r.id for update;

  if r.registration_status = 'cancelled' then
    raise exception 'This registration was cancelled. Please register again.' using errcode = 'P0001';
  end if;
  if r.payment_status = 'paid' or r.registration_status = 'enrolled' then
    raise exception 'This registration is already paid.' using errcode = 'P0001';
  end if;

  v_deadline := coalesce(c.payment_deadline, c.registration_deadline);
  if v_deadline is not null and v_deadline < v_today then
    raise exception 'The payment deadline for this cohort has passed.' using errcode = 'P0001';
  end if;
  if c.end_date is not null and c.end_date < v_today then
    raise exception 'This cohort has ended.' using errcode = 'P0001';
  end if;
  if r.amount_due <= 0 then
    raise exception 'No tuition is due for this registration.' using errcode = 'P0001';
  end if;

  if (select count(*) from public.paystack_payments p
      where p.registration_id = r.id and p.created_at > now() - interval '1 hour') >= 6 then
    raise exception 'Too many payment attempts. Please wait a few minutes and try again.' using errcode = 'P0001';
  end if;

  -- If the seat hold has lapsed, a seat must still be available.
  if c.seat_capacity is not null
     and not (coalesce(r.seat_held_until, 'infinity'::timestamptz) > now()
              or r.payment_status in ('submitted', 'partially_paid'))
     and public.cohort_seats_taken(c.id) >= c.seat_capacity then
    raise exception 'Sorry, this cohort is now full.' using errcode = 'P0001';
  end if;

  v_kobo := round(r.amount_due * 100)::bigint;

  insert into public.paystack_payments (registration_id, cohort_id, reference, amount_kobo, currency, status)
  values (r.id, c.id, p_reference, v_kobo, 'NGN', 'initialized')
  returning id into v_pid;

  -- Keep the seat while the student is paying.
  update public.cohort_registrations
  set seat_held_until = greatest(coalesce(seat_held_until, now()), now() + interval '30 minutes')
  where id = r.id;

  return query select v_pid, r.id, r.email, r.full_name, v_kobo, c.title, c.slug, r.registration_reference;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Confirm a charge. THE ONLY place a Paystack payment becomes paid and enrols a student.
--    Called by both the verify endpoint and the webhook. Calling it again is harmless.
--    Returns: confirmed | already_processed | needs_review | failed | abandoned | pending | not_found
-- ---------------------------------------------------------------------------
create or replace function public.paystack_confirm_charge(
  p_reference text,
  p_tx_id bigint,
  p_status text,
  p_amount_kobo bigint,
  p_currency text,
  p_channel text,
  p_paid_at timestamptz,
  p_gateway_response text,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.paystack_payments%rowtype;
  reg public.cohort_registrations%rowtype;
  v_reason text;
  v_new_status text;
begin
  select * into pay from public.paystack_payments where reference = p_reference for update;
  if not found then
    return 'not_found';
  end if;
  if pay.status = 'success' then
    return 'already_processed';
  end if;

  -- Anything other than a success never enrols anyone.
  if coalesce(p_status, '') <> 'success' then
    v_new_status := case
      when p_status in ('failed', 'reversed') then 'failed'
      when p_status = 'abandoned' then 'abandoned'
      else 'pending' end;
    update public.paystack_payments
    set status = case when status = 'needs_review' then status else v_new_status end,
        channel = coalesce(p_channel, channel),
        gateway_response = left(p_gateway_response, 300),
        provider_metadata = p_payload,
        updated_at = now()
    where id = pay.id;
    return v_new_status;
  end if;

  select * into reg from public.cohort_registrations x where x.id = pay.registration_id for update;

  if p_currency is distinct from 'NGN' or p_amount_kobo is distinct from pay.amount_kobo then
    v_reason := format('Amount or currency mismatch. Expected %s kobo NGN, received %s kobo %s.',
                       pay.amount_kobo, p_amount_kobo, p_currency);
  elsif reg.registration_status = 'cancelled' then
    v_reason := 'Payment received for a cancelled registration.';
  end if;

  begin
    if v_reason is null then
      update public.paystack_payments
      set status = 'success',
          paystack_transaction_id = p_tx_id,
          channel = p_channel,
          paid_at = coalesce(p_paid_at, now()),
          gateway_response = left(p_gateway_response, 300),
          provider_metadata = p_payload,
          review_reason = null,
          updated_at = now()
      where id = pay.id;
    else
      update public.paystack_payments
      set status = 'needs_review',
          review_reason = v_reason,
          paystack_transaction_id = coalesce(paystack_transaction_id, p_tx_id),
          channel = p_channel,
          gateway_response = left(p_gateway_response, 300),
          provider_metadata = p_payload,
          updated_at = now()
      where id = pay.id;
    end if;
  exception when unique_violation then
    -- This Paystack transaction is already linked to another attempt, or the registration
    -- already has a successful payment. Hold it for a person to review.
    update public.paystack_payments
    set status = 'needs_review',
        review_reason = 'Duplicate transaction, or this registration already has a successful payment.',
        provider_metadata = p_payload,
        updated_at = now()
    where id = pay.id;
    return 'needs_review';
  end;

  if v_reason is not null then
    return 'needs_review';
  end if;

  -- Fulfilment. All of this happens in this one transaction.
  perform set_config('app.payment_rpc', '1', true);

  insert into public.cohort_payments (registration_id, amount, payment_reference, payment_date, verification_status, verified_at)
  values (reg.id, (pay.amount_kobo / 100.0)::numeric(12, 2), pay.reference,
          (coalesce(p_paid_at, now()) at time zone 'Africa/Lagos')::date, 'verified', now());

  update public.cohort_registrations
  set payment_status = 'paid',
      registration_status = case when registration_status = 'registered' then 'enrolled' else registration_status end
  where id = reg.id;

  if reg.application_id is not null then
    update public.lead_pipeline set status = 'enrolled'
    where application_id = reg.application_id and status <> 'enrolled';
  end if;

  insert into public.email_outbox (registration_id, kind, to_email)
  values (reg.id, 'payment_confirmed', reg.email)
  on conflict do nothing;

  perform set_config('app.payment_rpc', '', true);
  return 'confirmed';
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Student lookups by private token (no accounts needed)
-- ---------------------------------------------------------------------------
create or replace function public.get_payment_status(p_pay_token uuid)
returns table (
  registration_reference text,
  full_name text,
  email text,
  cohort_title text,
  cohort_slug text,
  programme_name text,
  start_date date,
  amount_due numeric,
  payment_status text,
  registration_status text,
  last_attempt_status text,
  paid_reference text,
  paid_at timestamptz,
  payment_channel text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.registration_reference, r.full_name, r.email, c.title, c.slug, c.programme_name, c.start_date,
         r.amount_due, r.payment_status, r.registration_status,
         (select p2.status from public.paystack_payments p2
          where p2.registration_id = r.id order by p2.created_at desc limit 1),
         p.reference, p.paid_at, p.channel
  from public.cohort_registrations r
  join public.cohorts c on c.id = r.cohort_id
  left join lateral (
    select p3.reference, p3.paid_at, p3.channel
    from public.paystack_payments p3
    where p3.registration_id = r.id and p3.status = 'success'
    limit 1
  ) p on true
  where r.pay_token = p_pay_token;
$$;

-- Continue a registration with the reference AND the email it was made with.
create or replace function public.resume_cohort_registration(p_reference text, p_email text)
returns table (pay_token uuid, cohort_slug text)
language sql
stable
security definer
set search_path = public
as $$
  select r.pay_token, c.slug
  from public.cohort_registrations r
  join public.cohorts c on c.id = r.cohort_id
  where r.registration_reference = upper(trim(p_reference))
    and lower(r.email) = lower(trim(p_email))
    and r.registration_status <> 'cancelled';
$$;

-- ---------------------------------------------------------------------------
-- 10. Who can run what
-- ---------------------------------------------------------------------------
revoke all on function public.paystack_prepare_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.paystack_confirm_charge(text, bigint, text, bigint, text, text, timestamptz, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.paystack_prepare_attempt(uuid, text) to service_role;
grant execute on function public.paystack_confirm_charge(text, bigint, text, bigint, text, text, timestamptz, text, jsonb)
  to service_role;

revoke all on function public.get_payment_status(uuid) from public;
revoke all on function public.resume_cohort_registration(text, text) from public;
grant execute on function public.get_payment_status(uuid) to anon, authenticated;
grant execute on function public.resume_cohort_registration(text, text) to anon, authenticated;

revoke all on function public.cohort_seats_taken(uuid) from public, anon, authenticated;
grant execute on function public.cohort_seats_taken(uuid) to service_role;

commit;
