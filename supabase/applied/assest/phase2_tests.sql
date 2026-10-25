-- PHASE 2 TESTS: permissions, lead updates, public form still works
-- Run the whole file in the Supabase SQL Editor AFTER phase1_admin_foundation.sql and
-- phase2_leads_crm.sql. Everything runs in one transaction that is rolled back, so your real
-- data is not changed. Every line of output should start with PASS; a FAIL stops with an error.

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'test-staff@example.invalid'),
  ('00000000-0000-0000-0000-0000000000b2', 'test-viewer@example.invalid'),
  ('00000000-0000-0000-0000-0000000000b3', 'test-staff2@example.invalid');

insert into public.admin_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'staff'),
  ('00000000-0000-0000-0000-0000000000b2', 'viewer'),
  ('00000000-0000-0000-0000-0000000000b3', 'staff');

-- A test application, inserted as the database owner. The trigger should create its lead.
insert into public.course_applications (id, full_name, email, course)
values ('00000000-0000-0000-0000-00000000c001', 'Test Student', 'student@example.invalid', 'Test Course');

-- 1. Public form: the anonymous role can still submit an application, and a lead is created.
do $$
declare n integer; s text;
begin
  set local role anon;
  insert into public.course_applications (full_name, email, course)
  values ('Anon Applicant', 'anon-applicant@example.invalid', 'Test Course');
  reset role;
  raise notice 'PASS: anonymous visitors can still submit an application';

  select l.status into s
  from public.lead_pipeline l
  join public.course_applications a on a.id = l.application_id
  where a.email = 'anon-applicant@example.invalid';
  if s is distinct from 'new' then raise exception 'FAIL: new application did not get a lead with status new (got %)', s; end if;
  raise notice 'PASS: new application automatically gets a lead with status new';

  select l.status into s from public.lead_pipeline l
  where l.application_id = '00000000-0000-0000-0000-00000000c001';
  if s is distinct from 'new' then raise exception 'FAIL: test application lead missing'; end if;
end $$;

-- 2. The public can read none of the CRM data.
do $$
declare n integer;
begin
  set local role anon;
  begin
    perform 1 from public.lead_pipeline limit 1;
    raise exception 'FAIL: anon read lead_pipeline';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from lead_pipeline';
  end;
  begin
    perform 1 from public.communication_logs limit 1;
    raise exception 'FAIL: anon read communication_logs';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from communication_logs';
  end;
  begin
    perform 1 from public.lead_overview limit 1;
    raise exception 'FAIL: anon read lead_overview';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from lead_overview';
  end;
  begin
    select count(*) into n from public.course_applications;
    if n <> 0 then raise exception 'FAIL: anon read course_applications'; end if;
    raise notice 'PASS: anon cannot read applications';
  exception when insufficient_privilege then
    raise notice 'PASS: anon cannot read applications';
  end;
  reset role;
end $$;

-- 3. A viewer cannot see personal data or change anything.
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
  set local role authenticated;

  select count(*) into n from public.course_applications;
  if n <> 0 then raise exception 'FAIL: viewer read applications'; end if;
  raise notice 'PASS: viewer cannot read applications';

  select count(*) into n from public.lead_overview;
  if n <> 0 then raise exception 'FAIL: viewer read lead_overview'; end if;
  raise notice 'PASS: viewer sees no leads';

  update public.lead_pipeline set status = 'contacted' where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: viewer updated % leads', n; end if;
  raise notice 'PASS: viewer cannot update leads';
  reset role;
end $$;

-- 4. Staff can work leads, and the database enforces the rules.
do $$
declare n integer; r record;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
  set local role authenticated;

  select count(*) into n from public.lead_overview
  where application_id = '00000000-0000-0000-0000-00000000c001';
  if n <> 1 then raise exception 'FAIL: staff cannot see the lead'; end if;
  raise notice 'PASS: staff can read leads';

  -- Mark as contacted: contact time and staff member are filled in by the database.
  update public.lead_pipeline set status = 'contacted'
  where application_id = '00000000-0000-0000-0000-00000000c001';
  select * into r from public.lead_pipeline
  where application_id = '00000000-0000-0000-0000-00000000c001';
  if r.status <> 'contacted' or r.contacted_at is null
     or r.contacted_by <> '00000000-0000-0000-0000-0000000000b1' then
    raise exception 'FAIL: contacted status did not record time and staff member';
  end if;
  raise notice 'PASS: marking contacted records the time and the staff member';

  -- Follow-up date in the past is rejected.
  begin
    update public.lead_pipeline set follow_up_date = current_date - 5
    where application_id = '00000000-0000-0000-0000-00000000c001';
    raise exception 'FAIL: past follow-up date accepted';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: past follow-up date rejected';
  end;

  -- A future follow-up date is accepted, and closing the lead clears it.
  update public.lead_pipeline set follow_up_date = current_date + 7
  where application_id = '00000000-0000-0000-0000-00000000c001';
  update public.lead_pipeline set status = 'enrolled'
  where application_id = '00000000-0000-0000-0000-00000000c001';
  select * into r from public.lead_pipeline
  where application_id = '00000000-0000-0000-0000-00000000c001';
  if r.follow_up_date is not null then raise exception 'FAIL: closed lead kept its follow-up date'; end if;
  raise notice 'PASS: closing a lead clears its follow-up date';

  -- Opt-out cannot be reversed.
  perform public.record_opt_out('00000000-0000-0000-0000-00000000c001');
  begin
    update public.lead_pipeline set marketing_consent = 'granted'
    where application_id = '00000000-0000-0000-0000-00000000c001';
    raise exception 'FAIL: opt-out was reversed';
  exception when sqlstate 'P0001' then
    raise notice 'PASS: opt-out cannot be reversed';
  end;

  -- Original application cannot be edited or deleted.
  update public.course_applications set full_name = 'Changed'
  where id = '00000000-0000-0000-0000-00000000c001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: staff edited an application'; end if;
  delete from public.course_applications where id = '00000000-0000-0000-0000-00000000c001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: staff deleted an application'; end if;
  raise notice 'PASS: original applications cannot be edited or deleted by staff';

  -- Notes and communication logs: staff can add their own, not forge another person, not edit.
  insert into public.lead_notes (application_id, body)
  values ('00000000-0000-0000-0000-00000000c001', 'Called, will confirm next week.');
  raise notice 'PASS: staff can add a note';

  begin
    insert into public.lead_notes (application_id, body, author_id)
    values ('00000000-0000-0000-0000-00000000c001', 'Forged', '00000000-0000-0000-0000-0000000000b3');
    raise exception 'FAIL: staff forged another author';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot write a note as someone else';
  end;

  begin
    update public.lead_notes set body = 'Edited' where true;
    raise exception 'FAIL: notes are editable';
  exception when insufficient_privilege then
    raise notice 'PASS: notes cannot be edited';
  end;

  insert into public.communication_logs (application_id, channel, message_type)
  values ('00000000-0000-0000-0000-00000000c001', 'whatsapp', 'follow_up');
  raise notice 'PASS: staff can log a communication';

  begin
    insert into public.communication_logs (application_id, channel, message_type, staff_id)
    values ('00000000-0000-0000-0000-00000000c001', 'email', 'general', '00000000-0000-0000-0000-0000000000b3');
    raise exception 'FAIL: staff logged contact as someone else';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot log contact as someone else';
  end;

  begin
    delete from public.lead_pipeline where true;
    raise exception 'FAIL: staff deleted leads';
  exception when insufficient_privilege then
    raise notice 'PASS: staff cannot delete leads';
  end;
  reset role;
end $$;

-- 5. Changes are written to the audit log with the actor and without personal data.
do $$
declare n integer; leaked integer;
begin
  select count(*) into n from public.audit_logs
  where table_name = 'lead_pipeline' and action = 'UPDATE' and actor_role = 'staff'
    and 'status' = any (changed_columns);
  if n < 1 then raise exception 'FAIL: lead status change was not audited'; end if;
  raise notice 'PASS: lead status changes are audited with the actor role';

  select count(*) into leaked from public.audit_logs
  where new_values::text ilike '%example.invalid%' or old_values::text ilike '%example.invalid%';
  if leaked <> 0 then raise exception 'FAIL: personal data found in the audit log'; end if;
  raise notice 'PASS: no personal data in the audit log';
end $$;

rollback;
