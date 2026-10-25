-- PHASE 1 PERMISSION TESTS
-- Run the whole file in the Supabase SQL Editor. Everything happens inside one transaction that
-- is rolled back at the end, so no test data remains. Read the "Messages" or notices output:
-- every line should start with PASS. A FAIL stops the script with an error.
--
-- Requires: 20261022_cohort_platform.sql and phase1_admin_foundation.sql already applied.

begin;

-- Three throwaway users: an owner, a viewer, and a signed-in user with no admin role.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'test-owner@example.invalid'),
  ('00000000-0000-0000-0000-0000000000a2', 'test-viewer@example.invalid'),
  ('00000000-0000-0000-0000-0000000000a3', 'test-nobody@example.invalid');

insert into public.admin_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', 'viewer');

-- 1. Anonymous visitors cannot read admin tables.
do $$
declare n integer;
begin
  set local role anon;
  begin
    perform 1 from public.audit_logs limit 1;
    raise exception 'FAIL: anon could read audit_logs';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from audit_logs';
  end;
  begin
    perform 1 from public.admin_roles limit 1;
    raise exception 'FAIL: anon could read admin_roles';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from admin_roles';
  end;
  begin
    select count(*) into n from public.cohort_registrations;
    if n <> 0 then raise exception 'FAIL: anon could read cohort_registrations'; end if;
    raise notice 'PASS: anon sees no cohort_registrations';
  exception when insufficient_privilege then
    raise notice 'PASS: anon blocked from cohort_registrations';
  end;
  reset role;
end $$;

-- 2. A signed-in user with no admin role sees nothing and cannot write.
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
  set local role authenticated;

  select count(*) into n from public.audit_logs;
  if n <> 0 then raise exception 'FAIL: non-admin saw % audit rows', n; end if;
  raise notice 'PASS: non-admin sees no audit logs';

  select count(*) into n from public.cohort_registrations;
  if n <> 0 then raise exception 'FAIL: non-admin saw registrations'; end if;
  raise notice 'PASS: non-admin sees no registrations';

  begin
    insert into public.admin_roles (user_id, role)
    values ('00000000-0000-0000-0000-0000000000a3', 'owner');
    raise exception 'FAIL: non-admin granted themselves owner';
  exception when insufficient_privilege then
    raise notice 'PASS: non-admin cannot grant themselves a role';
  end;

  begin
    perform public.cohort_admin_metrics();
    raise exception 'FAIL: non-admin called admin metrics';
  exception when insufficient_privilege then
    raise notice 'PASS: non-admin cannot call admin metrics';
  end;
  reset role;
end $$;

-- 3. A viewer can look but not change.
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
  set local role authenticated;

  begin
    insert into public.cohorts (programme_name, slug, title)
    values ('Test', 'viewer-should-fail', 'Test');
    raise exception 'FAIL: viewer created a cohort';
  exception when insufficient_privilege then
    raise notice 'PASS: viewer cannot create cohorts';
  end;

  begin
    perform public.verify_cohort_payment(gen_random_uuid(), true);
    raise exception 'FAIL: viewer verified a payment';
  exception when insufficient_privilege then
    raise notice 'PASS: viewer cannot verify payments';
  end;
  reset role;
end $$;

-- 4. The owner can manage cohorts, and the change is written to the audit log.
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;

  insert into public.cohorts (programme_name, slug, title)
  values ('Test', 'owner-test-cohort', 'Owner test cohort');
  raise notice 'PASS: owner can create a cohort';

  select count(*) into n from public.audit_logs
  where table_name = 'cohorts' and action = 'INSERT' and actor_role = 'owner';
  if n < 1 then raise exception 'FAIL: cohort creation was not audited'; end if;
  raise notice 'PASS: cohort creation recorded in audit log with actor role';

  begin
    update public.audit_logs set action = 'TAMPERED' where true;
    raise exception 'FAIL: audit log was editable';
  exception when insufficient_privilege then
    raise notice 'PASS: audit log cannot be edited';
  end;
  reset role;
end $$;

-- 5. A draft cannot be published without the facts needed to sell it.
do $$
begin
  begin
    update public.cohorts set publication_status = 'published' where slug = 'owner-test-cohort';
    raise exception 'FAIL: incomplete cohort was published';
  exception when check_violation then
    raise notice 'PASS: incomplete cohort cannot be published';
  end;
end $$;

rollback;
