-- PAYSTACK STEP 1 TESTS: registration, attempts, confirmation, seats, permissions
-- Run the whole file in the Supabase SQL Editor AFTER phase4_paystack_core.sql.
-- It runs in one transaction that is rolled back, so no data remains.
-- Every line of output should start with PASS; a FAIL stops the script with an error.
--
-- These tests call the database functions directly with Paystack-shaped values. They do not
-- contact Paystack. The Edge Functions are tested separately (see PAYSTACK_SETUP.md).

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'p4-admin@example.invalid');
insert into public.admin_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'admin');

insert into public.cohorts (id, programme_name, slug, title, start_date, end_date, registration_deadline,
                            payment_deadline, tuition_fee, seat_capacity, seat_hold_hours,
                            publication_status, cohort_status, payment_options)
values ('00000000-0000-0000-0000-00000000a0f1', 'P4 Test', 'p4-test-cohort', 'P4 Test Cohort',
        current_date + 30, current_date + 90, current_date + 10, current_date + 10,
        45000, 2, 48, 'published', 'open', array['full']);

-- 1. Public registration: token, lead, email queue, seat hold.
do $$
declare ref text; due numeric; tok uuid; r record; n integer;
begin
  set local role anon;
  select registration_reference, amount_due, pay_token into ref, due, tok
  from public.register_for_cohort('p4-test-cohort', 'Student A', 'p4-a@example.invalid',
       '+2348011111111', 'beginner', 'Learn data analysis', 'full', true, null);
  reset role;

  if ref is null or tok is null then raise exception using errcode = 'TF001', message = 'FAIL: registration did not return a reference and token'; end if;
  if due <> 45000 then raise exception using errcode = 'TF001', message = format('FAIL: amount due was %s, expected 45000', due); end if;
  raise notice 'PASS: registration returns a reference, a private token and the tuition from the database';

  select * into r from public.cohort_registrations where registration_reference = ref;
  if r.payment_status <> 'pending' or r.registration_status <> 'registered' then
    raise exception using errcode = 'TF001', message = 'FAIL: new registration should be registered and pending';
  end if;
  if r.seat_held_until is null or r.seat_held_until < now() + interval '47 hours' then
    raise exception using errcode = 'TF001', message = 'FAIL: seat hold was not set to about 48 hours';
  end if;
  raise notice 'PASS: new registration is pending and holds its seat for the configured hours';

  select count(*) into n from public.course_applications a
  join public.lead_pipeline l on l.application_id = a.id
  where a.id = r.application_id and a.source = 'cohort:p4-test-cohort' and l.status = 'new';
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: the registration did not create a new lead'; end if;
  raise notice 'PASS: the registrant is kept as a lead for follow-up';

  select count(*) into n from public.email_outbox where registration_id = r.id and kind = 'registration_received';
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: registration email not queued once'; end if;
  raise notice 'PASS: registration email queued once';
end $$;

-- 2. Duplicate registration is refused; the email and reference together recover the token.
do $$
declare tok uuid; tok2 uuid; ref text; n integer;
begin
  -- Read the saved values first, as the database owner (the public cannot read registrations).
  select registration_reference, pay_token into ref, tok
  from public.cohort_registrations where email = 'p4-a@example.invalid';

  set local role anon;
  begin
    perform * from public.register_for_cohort('p4-test-cohort', 'Student A', 'P4-A@example.invalid',
       '+2348011111111', 'beginner', 'again', 'full', true, null);
    raise exception using errcode = 'TF001', message = 'FAIL: duplicate registration accepted';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: duplicate registration refused';
  end;

  select pay_token into tok2 from public.resume_cohort_registration(ref, 'P4-A@example.invalid');
  if tok2 is distinct from tok then raise exception using errcode = 'TF001', message = 'FAIL: resume did not return the token'; end if;
  raise notice 'PASS: reference plus email recovers the registration';

  select count(*) into n from public.resume_cohort_registration(ref, 'wrong@example.invalid');
  if n <> 0 then raise exception using errcode = 'TF001', message = 'FAIL: resume worked with the wrong email'; end if;
  select count(*) into n from public.get_payment_status(gen_random_uuid());
  if n <> 0 then raise exception using errcode = 'TF001', message = 'FAIL: unknown token returned a registration'; end if;
  select count(*) into n from public.get_payment_status(tok);
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: valid token returned no registration'; end if;
  reset role;
  raise notice 'PASS: wrong email and unknown tokens return nothing; a valid token returns the registration';
end $$;

-- 3. The public cannot touch payment tables or the payment functions.
do $$
begin
  set local role anon;
  begin perform 1 from public.paystack_payments limit 1;
    raise exception using errcode = 'TF001', message = 'FAIL: anon read paystack_payments';
  exception when insufficient_privilege then raise notice 'PASS: anon blocked from paystack_payments'; end;
  begin perform 1 from public.payment_events limit 1;
    raise exception using errcode = 'TF001', message = 'FAIL: anon read payment_events';
  exception when insufficient_privilege then raise notice 'PASS: anon blocked from payment_events'; end;
  begin perform 1 from public.email_outbox limit 1;
    raise exception using errcode = 'TF001', message = 'FAIL: anon read email_outbox';
  exception when insufficient_privilege then raise notice 'PASS: anon blocked from email_outbox'; end;
  begin perform public.paystack_confirm_charge('X', 1, 'success', 1, 'NGN', null, null, null, null);
    raise exception using errcode = 'TF001', message = 'FAIL: anon ran paystack_confirm_charge';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot confirm payments'; end;
  begin perform * from public.paystack_prepare_attempt(gen_random_uuid(), 'PSK-ANON-0001');
    raise exception using errcode = 'TF001', message = 'FAIL: anon ran paystack_prepare_attempt';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot create payment attempts'; end;
  reset role;
end $$;

-- 4. Attempts use the database tuition in kobo; a wrong amount is held, never enrolled.
do $$
declare tok uuid; pid uuid; kobo bigint; res text; r record; n integer;
begin
  select pay_token into tok from public.cohort_registrations where email = 'p4-a@example.invalid';

  set local role service_role;
  select o_payment_id, o_amount_kobo into pid, kobo from public.paystack_prepare_attempt(tok, 'PSK-TEST-0001');
  if kobo <> 4500000 then raise exception using errcode = 'TF001', message = format('FAIL: expected 4500000 kobo, got %s', kobo); end if;
  raise notice 'PASS: attempt amount comes from the database (45000 naira = 4500000 kobo)';

  res := public.paystack_confirm_charge('PSK-TEST-0001', 900001, 'success', 4400000, 'NGN', 'card', now(), 'Approved', '{}'::jsonb);
  if res <> 'needs_review' then raise exception using errcode = 'TF001', message = format('FAIL: wrong amount gave %s', res); end if;
  reset role;

  select * into r from public.cohort_registrations where email = 'p4-a@example.invalid';
  select count(*) into n from public.cohort_payments where registration_id = r.id and verification_status = 'verified';
  if r.payment_status <> 'pending' or r.registration_status <> 'registered' or n <> 0 then
    raise exception using errcode = 'TF001', message = 'FAIL: a wrong amount changed the registration';
  end if;
  raise notice 'PASS: a payment with the wrong amount is held for review and does not enrol';

  set local role service_role;
  perform * from public.paystack_prepare_attempt(tok, 'PSK-TEST-0002');
  res := public.paystack_confirm_charge('PSK-TEST-0002', null, 'failed', 4500000, 'NGN', 'card', null, 'Declined', '{}'::jsonb);
  if res <> 'failed' then raise exception using errcode = 'TF001', message = format('FAIL: failed payment gave %s', res); end if;
  res := public.paystack_confirm_charge('PSK-NOT-OURS', 1, 'success', 1, 'NGN', null, null, null, '{}'::jsonb);
  if res <> 'not_found' then raise exception using errcode = 'TF001', message = 'FAIL: unknown reference was not rejected'; end if;
  reset role;
  raise notice 'PASS: failed payments and unknown references never enrol anyone';
end $$;

-- 5. A correct payment enrols, once, and repeating it changes nothing.
do $$
declare tok uuid; res text; r record; n integer; m integer; rev numeric; lead_status text;
begin
  select pay_token into tok from public.cohort_registrations where email = 'p4-a@example.invalid';

  set local role service_role;
  perform * from public.paystack_prepare_attempt(tok, 'PSK-TEST-0003');
  res := public.paystack_confirm_charge('PSK-TEST-0003', 900003, 'success', 4500000, 'NGN', 'card', now(), 'Approved', '{"id":900003}'::jsonb);
  reset role;
  if res <> 'confirmed' then raise exception using errcode = 'TF001', message = format('FAIL: correct payment gave %s', res); end if;

  select * into r from public.cohort_registrations where email = 'p4-a@example.invalid';
  if r.payment_status <> 'paid' or r.registration_status <> 'enrolled' then
    raise exception using errcode = 'TF001', message = 'FAIL: correct payment did not mark paid and enrolled';
  end if;
  raise notice 'PASS: a correct payment marks the registration paid and enrolled';

  select count(*) into n from public.cohort_payments
  where registration_id = r.id and verification_status = 'verified' and amount = 45000 and payment_reference = 'PSK-TEST-0003';
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: verified payment row missing'; end if;
  select coalesce(verified_revenue, 0) into rev from public.cohort_admin_summary where cohort_id = r.cohort_id;
  if rev < 45000 then raise exception using errcode = 'TF001', message = 'FAIL: revenue not counted from the verified payment'; end if;
  raise notice 'PASS: verified payment is recorded and counted in revenue';

  select l.status into lead_status from public.lead_pipeline l where l.application_id = r.application_id;
  if lead_status <> 'enrolled' then raise exception using errcode = 'TF001', message = 'FAIL: lead was not set to enrolled'; end if;
  raise notice 'PASS: the lead is set to enrolled';

  select count(*) into n from public.email_outbox where registration_id = r.id and kind = 'payment_confirmed';
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: confirmation email not queued once'; end if;

  -- Repeat the same confirmation (as a webhook retry would).
  set local role service_role;
  res := public.paystack_confirm_charge('PSK-TEST-0003', 900003, 'success', 4500000, 'NGN', 'card', now(), 'Approved', '{}'::jsonb);
  if res <> 'already_processed' then raise exception using errcode = 'TF001', message = format('FAIL: repeat gave %s', res); end if;
  -- An earlier held attempt later reports success: still only one payment.
  res := public.paystack_confirm_charge('PSK-TEST-0001', 900099, 'success', 4500000, 'NGN', 'card', now(), 'Approved', '{}'::jsonb);
  if res <> 'needs_review' then raise exception using errcode = 'TF001', message = format('FAIL: second success gave %s', res); end if;
  reset role;

  select count(*) into n from public.cohort_payments where registration_id = r.id and verification_status = 'verified';
  select count(*) into m from public.email_outbox where registration_id = r.id and kind = 'payment_confirmed';
  if n <> 1 or m <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: repeated confirmation created duplicates'; end if;
  raise notice 'PASS: repeating a confirmation creates no duplicate payment, enrolment or email';

  set local role service_role;
  begin
    perform * from public.paystack_prepare_attempt(tok, 'PSK-TEST-0004');
    raise exception using errcode = 'TF001', message = 'FAIL: a paid registration could start another payment';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: a paid registration cannot start another payment';
  end;
  reset role;

  set local role anon;
  select count(*) into n from public.get_payment_status(tok) s
  where s.payment_status = 'paid' and s.paid_reference = 'PSK-TEST-0003' and s.registration_status = 'enrolled';
  reset role;
  if n <> 1 then raise exception using errcode = 'TF001', message = 'FAIL: status lookup did not show the paid receipt'; end if;
  raise notice 'PASS: the student status lookup shows the confirmed payment';
end $$;

-- 6. Seats: capacity 2. A is paid. B holds a seat. C is refused. B's hold lapses and C gets in.
do $$
declare tokb uuid; tokc uuid; res text; n integer;
begin
  set local role anon;
  perform * from public.register_for_cohort('p4-test-cohort', 'Student B', 'p4-b@example.invalid',
       '+2348022222222', 'beginner', 'Learn data', 'full', true, null);
  begin
    perform * from public.register_for_cohort('p4-test-cohort', 'Student C', 'p4-c@example.invalid',
       '+2348033333333', 'beginner', 'Learn data', 'full', true, null);
    raise exception using errcode = 'TF001', message = 'FAIL: registration accepted beyond capacity';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: a full cohort refuses new registrations';
  end;
  reset role;

  -- B's hold expires, and A's hold expiring must not matter because A is paid.
  update public.cohort_registrations set seat_held_until = now() - interval '1 hour'
  where email in ('p4-b@example.invalid', 'p4-a@example.invalid');

  set local role anon;
  perform * from public.register_for_cohort('p4-test-cohort', 'Student C', 'p4-c@example.invalid',
       '+2348033333333', 'beginner', 'Learn data', 'full', true, null);
  reset role;
  raise notice 'PASS: an expired hold releases the seat; a paid student keeps theirs';

  select pay_token into tokb from public.cohort_registrations where email = 'p4-b@example.invalid';
  set local role service_role;
  begin
    perform * from public.paystack_prepare_attempt(tokb, 'PSK-TEST-B001');
    raise exception using errcode = 'TF001', message = 'FAIL: expired registration paid into a full cohort';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: a lapsed registration cannot pay into a cohort that has filled up';
  end;

  -- The same Paystack transaction id cannot enrol two people.
  select pay_token into tokc from public.cohort_registrations where email = 'p4-c@example.invalid';
  perform * from public.paystack_prepare_attempt(tokc, 'PSK-TEST-C001');
  res := public.paystack_confirm_charge('PSK-TEST-C001', 900003, 'success', 4500000, 'NGN', 'card', now(), 'Approved', '{}'::jsonb);
  reset role;
  if res <> 'needs_review' then raise exception using errcode = 'TF001', message = format('FAIL: reused transaction id gave %s', res); end if;
  select count(*) into n from public.cohort_registrations where email = 'p4-c@example.invalid' and payment_status = 'paid';
  if n <> 0 then raise exception using errcode = 'TF001', message = 'FAIL: reused transaction id enrolled a second person'; end if;
  raise notice 'PASS: one Paystack transaction cannot enrol two people';
end $$;

-- 7. Deadline and rate limit.
do $$
declare tokc uuid; i integer;
begin
  select pay_token into tokc from public.cohort_registrations where email = 'p4-c@example.invalid';

  update public.cohorts set payment_deadline = current_date - 1, registration_deadline = current_date - 1
  where id = '00000000-0000-0000-0000-00000000a0f1';
  set local role service_role;
  begin
    perform * from public.paystack_prepare_attempt(tokc, 'PSK-TEST-LATE1');
    raise exception using errcode = 'TF001', message = 'FAIL: payment accepted after the payment deadline';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: payment is refused after the payment deadline';
  end;
  reset role;

  update public.cohorts set payment_deadline = current_date + 10, registration_deadline = current_date + 10
  where id = '00000000-0000-0000-0000-00000000a0f1';
  set local role service_role;
  for i in 2..6 loop
    perform * from public.paystack_prepare_attempt(tokc, 'PSK-TEST-RATE' || i);
  end loop;
  begin
    perform * from public.paystack_prepare_attempt(tokc, 'PSK-TEST-RATE9');
    raise exception using errcode = 'TF001', message = 'FAIL: no limit on payment attempts';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: too many payment attempts in an hour are refused';
  end;
  reset role;
end $$;

-- 8. Admins cannot bypass the rules by editing records directly.
do $$
declare rid uuid;
begin
  select id into rid from public.cohort_registrations where email = 'p4-c@example.invalid';
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.cohort_registrations set pay_token = gen_random_uuid() where id = rid;
    raise exception using errcode = 'TF001', message = 'FAIL: admin changed a payment token';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: payment tokens cannot be changed';
  end;
  begin
    update public.cohort_registrations set payment_status = 'paid' where id = rid;
    raise exception using errcode = 'TF001', message = 'FAIL: admin marked a registration paid directly';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: admin cannot mark a registration paid directly';
  end;
  begin
    insert into public.cohort_payments (registration_id, amount, payment_reference, verification_status)
    values (rid, 45000, 'FORGED-1', 'verified');
    perform 1;
  exception when others then null;
  end;
  if exists (select 1 from public.cohort_payments where payment_reference = 'FORGED-1' and verification_status = 'verified') then
    raise exception using errcode = 'TF001', message = 'FAIL: admin inserted a verified payment directly';
  end if;
  raise notice 'PASS: admin cannot insert a verified payment directly';
  reset role;
end $$;

rollback;
