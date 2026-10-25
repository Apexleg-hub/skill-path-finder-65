-- PHASE 3 TESTS: payments, payment verification, cohort guards, public registration still works
-- Run the whole file in the Supabase SQL Editor AFTER the cohort migration and phase1, phase2 and
-- phase3 migrations. Everything runs in one transaction that is rolled back, so no data remains.
-- Every line of output should start with PASS; a FAIL stops the script with an error.

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'p3-staff@example.invalid'),
  ('00000000-0000-0000-0000-0000000000d2', 'p3-admin@example.invalid'),
  ('00000000-0000-0000-0000-0000000000d3', 'p3-owner@example.invalid');
insert into public.admin_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000d1', 'staff'),
  ('00000000-0000-0000-0000-0000000000d2', 'admin'),
  ('00000000-0000-0000-0000-0000000000d3', 'owner');

insert into public.course_applications (id, full_name, email, course) values
  ('00000000-0000-0000-0000-00000000e001', 'P3 Student', 'p3-student@example.invalid', 'Test Course'),
  ('00000000-0000-0000-0000-00000000e002', 'P3 Student Two', 'p3-student2@example.invalid', 'Test Course');
-- (the Phase 2 trigger has created their lead rows)

-- A published, open cohort for the cohort-side checks.
insert into public.cohorts (id, programme_name, slug, title, start_date, end_date, registration_deadline,
                            tuition_fee, seat_capacity, publication_status, cohort_status, payment_options)
values ('00000000-0000-0000-0000-00000000f001', 'P3 Test', 'p3-test-cohort', 'P3 Test Cohort',
        current_date + 30, current_date + 90, current_date + 20, 50000, 5, 'published', 'open',
        array['full']);

-- 1. Staff can enter a payment, but it always starts pending and cannot be forged.
do $$
declare r record;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
  set local role authenticated;

  insert into public.student_payments (application_id, amount, payment_reference, payment_method, verification_status, verified_by)
  values ('00000000-0000-0000-0000-00000000e001', 30000, 'TRF-1001', 'bank_transfer', 'verified',
          '00000000-0000-0000-0000-0000000000d1');
  select * into r from public.student_payments where payment_reference = 'TRF-1001';
  if r.verification_status <> 'pending' or r.verified_by is not null then
    raise exception using errcode = 'TF001', message = 'FAIL: a manually entered payment was not forced to pending';
  end if;
  raise notice 'PASS: manually entered payments always start pending';

  begin
    insert into public.student_payments (application_id, amount, payment_reference, payment_method, entered_by)
    values ('00000000-0000-0000-0000-00000000e001', 100, 'TRF-FORGED', 'cash', '00000000-0000-0000-0000-0000000000d2');
    raise exception using errcode = 'TF001', message = 'FAIL: staff entered a payment as someone else';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot record a payment as another person';
  end;

  begin
    insert into public.student_payments (application_id, amount, payment_reference, payment_method)
    values ('00000000-0000-0000-0000-00000000e001', 30000, 'trf-1001 ', 'bank_transfer');
    raise exception using errcode = 'TF001', message = 'FAIL: duplicate payment reference accepted';
  exception when unique_violation then
    raise notice 'PASS: duplicate payment reference blocked';
  end;

  begin
    insert into public.student_payments (application_id, amount, payment_reference, payment_method)
    values ('00000000-0000-0000-0000-00000000e001', -5, 'TRF-NEG', 'cash');
    raise exception using errcode = 'TF001', message = 'FAIL: negative amount accepted';
  exception when check_violation then
    raise notice 'PASS: zero or negative amounts rejected';
  end;

  begin
    insert into public.student_payments (application_id, amount, payment_reference, payment_method, payment_date)
    values ('00000000-0000-0000-0000-00000000e001', 100, 'TRF-FUTURE', 'cash', current_date + 10);
    raise exception using errcode = 'TF001', message = 'FAIL: future payment date accepted';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: future payment dates rejected';
  end;

  begin
    update public.student_payments set verification_status = 'verified' where true;
    raise exception using errcode = 'TF001', message = 'FAIL: staff edited payment status directly';
  exception when insufficient_privilege then
    raise notice 'PASS: payment status cannot be edited directly';
  end;

  begin
    perform public.verify_student_payment((select id from public.student_payments where payment_reference = 'TRF-1001'), true);
    raise exception using errcode = 'TF001', message = 'FAIL: staff verified a payment';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot verify payments';
  end;

  begin
    update public.lead_pipeline set tuition_amount = 50000
    where application_id = '00000000-0000-0000-0000-00000000e001';
    raise exception using errcode = 'TF001', message = 'FAIL: staff set agreed tuition';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: staff cannot set agreed tuition';
  end;
  reset role;
end $$;

-- 2. Admin sets the tuition and verifies: part payment does not enrol, full payment does.
do $$
declare s text; vb uuid; pid uuid;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
  set local role authenticated;

  update public.lead_pipeline set tuition_amount = 50000
  where application_id = '00000000-0000-0000-0000-00000000e001';
  raise notice 'PASS: admin can set agreed tuition';

  select id into pid from public.student_payments where payment_reference = 'TRF-1001';
  perform public.verify_student_payment(pid, true);
  select verification_status, verified_by into s, vb from public.student_payments where id = pid;
  if s <> 'verified' or vb <> '00000000-0000-0000-0000-0000000000d2' then
    raise exception using errcode = 'TF001', message = 'FAIL: verification did not record the verifier';
  end if;
  raise notice 'PASS: admin can verify a payment and the verifier is recorded';

  select status into s from public.lead_pipeline where application_id = '00000000-0000-0000-0000-00000000e001';
  if s = 'enrolled' then raise exception using errcode = 'TF001', message = 'FAIL: part payment enrolled the student'; end if;
  raise notice 'PASS: a part payment does not enrol the student';

  begin
    perform public.verify_student_payment(pid, false, 'changed my mind');
    raise exception using errcode = 'TF001', message = 'FAIL: a decided payment was changed';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: a decided payment cannot be changed';
  end;
  reset role;
end $$;

-- Staff enters the balance; admin verifies it; the student becomes enrolled.
do $$
declare s text; pid uuid; v numeric;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.student_payments (application_id, amount, payment_reference, payment_method)
  values ('00000000-0000-0000-0000-00000000e001', 20000, 'TRF-1002', 'cash');
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
  set local role authenticated;
  select id into pid from public.student_payments where payment_reference = 'TRF-1002';
  perform public.verify_student_payment(pid, true);
  select status into s from public.lead_pipeline where application_id = '00000000-0000-0000-0000-00000000e001';
  if s <> 'enrolled' then raise exception using errcode = 'TF001', message = format('FAIL: fully paid student not enrolled (status %s)', s); end if;
  raise notice 'PASS: full verified payment enrols the student';

  select outstanding into v from public.lead_payment_summary where application_id = '00000000-0000-0000-0000-00000000e001';
  if v <> 0 then raise exception using errcode = 'TF001', message = format('FAIL: outstanding should be 0, got %s', v); end if;
  raise notice 'PASS: outstanding amount is calculated from verified payments';
  reset role;
end $$;

-- 3. Rejection needs a reason, and an admin cannot verify their own entry (the owner may).
do $$
declare pid uuid; s text;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.student_payments (application_id, amount, payment_reference, payment_method)
  values ('00000000-0000-0000-0000-00000000e002', 1000, 'TRF-2001', 'pos');
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
  set local role authenticated;
  select id into pid from public.student_payments where payment_reference = 'TRF-2001';
  begin
    perform public.verify_student_payment(pid, false);
    raise exception using errcode = 'TF001', message = 'FAIL: rejected without a reason';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: rejection requires a reason';
  end;
  perform public.verify_student_payment(pid, false, 'No matching bank credit');
  select verification_status into s from public.student_payments where id = pid;
  if s <> 'rejected' then raise exception using errcode = 'TF001', message = 'FAIL: payment not rejected'; end if;
  raise notice 'PASS: admin can reject with a reason';

  insert into public.student_payments (application_id, amount, payment_reference, payment_method)
  values ('00000000-0000-0000-0000-00000000e002', 2000, 'TRF-2002', 'cash');
  select id into pid from public.student_payments where payment_reference = 'TRF-2002';
  begin
    perform public.verify_student_payment(pid, true);
    raise exception using errcode = 'TF001', message = 'FAIL: admin verified their own entry';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: an admin cannot verify a payment they entered';
  end;
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d3","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.student_payments (application_id, amount, payment_reference, payment_method)
  values ('00000000-0000-0000-0000-00000000e002', 3000, 'TRF-2003', 'cash');
  select id into pid from public.student_payments where payment_reference = 'TRF-2003';
  perform public.verify_student_payment(pid, true);
  raise notice 'PASS: the owner may verify their own entry';
  reset role;
end $$;

-- 4. The public cannot see payments; the audit log captured verification.
do $$
declare n integer;
begin
  set local role anon;
  begin
    perform 1 from public.student_payments limit 1;
    raise exception using errcode = 'TF001', message = 'FAIL: anon read student_payments';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from student_payments';
  end;
  reset role;

  select count(*) into n from public.audit_logs
  where table_name = 'student_payments' and action = 'UPDATE'
    and 'verification_status' = any (changed_columns) and actor_role in ('admin', 'owner');
  if n < 3 then raise exception using errcode = 'TF001', message = format('FAIL: payment verifications not audited (found %s)', n); end if;
  raise notice 'PASS: payment verifications are audited';
end $$;

-- 5. Public registration for a cohort still works end to end, and its payment flow is guarded.
do $$
declare ref text; due numeric; rs text; ps text; n integer;
begin
  set local role anon;
  select registration_reference, amount_due into ref, due
  from public.register_for_cohort('p3-test-cohort', 'Cohort Student', 'cohort-student@example.invalid',
       '+2348012345678', 'beginner', 'I want to learn data skills', 'full', true, null);
  reset role;
  if ref is null or due <> 50000 then raise exception using errcode = 'TF001', message = 'FAIL: public cohort registration failed'; end if;
  raise notice 'PASS: public cohort registration still works';

  set local role anon;
  perform public.submit_cohort_payment(ref, 'cohort-student@example.invalid', 50000, 'CH-TRF-1', current_date);
  reset role;
  select registration_status, payment_status into rs, ps from public.cohort_registrations where registration_reference = ref;
  if ps <> 'submitted' or rs <> 'registered' then
    raise exception using errcode = 'TF001', message = format('FAIL: submitting payment details gave %s / %s', rs, ps);
  end if;
  raise notice 'PASS: submitting payment details marks the registration submitted, not paid';
end $$;

-- 6. Cohort admin cannot bypass verification.
do $$
declare reg uuid; pid uuid; rs text; ps text; n integer;
begin
  select id into reg from public.cohort_registrations where email = 'cohort-student@example.invalid';
  select id into pid from public.cohort_payments where registration_id = reg;

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
  set local role authenticated;

  begin
    update public.cohort_payments set verification_status = 'verified' where id = pid;
    raise exception using errcode = 'TF001', message = 'FAIL: admin marked a cohort payment verified directly';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: cohort payments cannot be marked verified directly';
  end;

  begin
    update public.cohort_registrations set payment_status = 'paid' where id = reg;
    raise exception using errcode = 'TF001', message = 'FAIL: admin marked a registration paid directly';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: registrations cannot be marked paid directly';
  end;

  begin
    update public.cohort_registrations set registration_status = 'enrolled' where id = reg;
    raise exception using errcode = 'TF001', message = 'FAIL: admin enrolled a registration directly';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: registrations cannot be enrolled without verified payment';
  end;

  begin
    insert into public.cohort_registrations (cohort_id, full_name, email, phone, experience_level,
      registration_reference, amount_due, consent_given, payment_status)
    values ('00000000-0000-0000-0000-00000000f001', 'Forged', 'forged@example.invalid', '08012345678', 'beginner',
            'CPT-FORGED1', 50000, true, 'paid');
    raise exception using errcode = 'TF001', message = 'FAIL: admin inserted a registration already marked paid';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: registrations cannot be created as paid';
  end;

  -- Cancelling is allowed.
  update public.cohort_registrations set registration_status = 'cancelled' where id = reg;
  update public.cohort_registrations set registration_status = 'registered' where id = reg;
  raise notice 'PASS: admin can still cancel and reinstate a registration';

  -- The real route works and flows through to paid and enrolled.
  perform public.verify_cohort_payment(pid, true);
  select registration_status, payment_status into rs, ps from public.cohort_registrations where id = reg;
  if ps <> 'paid' or rs <> 'enrolled' then raise exception using errcode = 'TF001', message = format('FAIL: verification gave %s / %s', rs, ps); end if;
  raise notice 'PASS: verifying a cohort payment marks the registration paid and enrolled';

  begin
    perform public.verify_cohort_payment(pid, false);
    raise exception using errcode = 'TF001', message = 'FAIL: a decided cohort payment was changed';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: a decided cohort payment cannot be changed';
  end;

  -- Curriculum is saved atomically and validated.
  perform public.save_cohort_curriculum('00000000-0000-0000-0000-00000000f001',
    '[{"week_number":1,"module_title":"Intro","topics":["a","b"]},{"week_number":2,"module_title":"Next"}]'::jsonb);
  select count(*) into n from public.cohort_curriculum where cohort_id = '00000000-0000-0000-0000-00000000f001';
  if n <> 2 then raise exception using errcode = 'TF001', message = 'FAIL: curriculum not saved'; end if;
  begin
    perform public.save_cohort_curriculum('00000000-0000-0000-0000-00000000f001', '[{"module_title":""}]'::jsonb);
    raise exception using errcode = 'TF001', message = 'FAIL: untitled module accepted';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: curriculum saved atomically and validated';
  end;
  select count(*) into n from public.cohort_curriculum where cohort_id = '00000000-0000-0000-0000-00000000f001';
  if n <> 2 then raise exception using errcode = 'TF001', message = 'FAIL: failed save damaged the existing curriculum'; end if;
  raise notice 'PASS: a failed curriculum save leaves the old one intact';

  -- Export logging.
  perform public.log_data_export('cohort_registrations', 1);
  reset role;
end $$;

-- 7. Staff cannot reach cohort data or exports.
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.cohort_registrations;
  if n <> 0 then raise exception using errcode = 'TF001', message = 'FAIL: staff read cohort registrations'; end if;
  raise notice 'PASS: staff cannot read cohort registrations';
  begin
    perform public.log_data_export('cohort_registrations', 1);
    raise exception using errcode = 'TF001', message = 'FAIL: staff logged an export';
  exception when insufficient_privilege then
    raise notice 'PASS: only admins can export';
  end;
  begin
    perform public.save_cohort_curriculum('00000000-0000-0000-0000-00000000f001', '[]'::jsonb);
    raise exception using errcode = 'TF001', message = 'FAIL: staff changed a curriculum';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot change cohort curriculum';
  end;
  reset role;
end $$;

rollback;
