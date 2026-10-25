-- PHASE 0 (single result): read-only. Returns ONE row with ONE column called "inspection".
-- Click the cell, copy its contents, and paste them back to me. Contains no student data.

select jsonb_build_object(
  'course_applications_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'column', column_name, 'type', data_type, 'nullable', is_nullable, 'default', column_default
    ) order by ordinal_position), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'course_applications'
  ),
  'course_applications_constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', conname, 'type', contype, 'definition', pg_get_constraintdef(oid)
    )), '[]'::jsonb)
    from pg_constraint
    where conrelid = 'public.course_applications'::regclass
  ),
  'course_applications_indexes', (
    select coalesce(jsonb_agg(indexdef), '[]'::jsonb)
    from pg_indexes
    where schemaname = 'public' and tablename = 'course_applications'
  ),
  'tables_and_rls', (
    select coalesce(jsonb_agg(jsonb_build_object('table', c.relname, 'rls_enabled', c.relrowsecurity)
           order by c.relname), '[]'::jsonb)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  'policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', tablename, 'policy', policyname, 'command', cmd, 'roles', roles,
      'using', qual, 'with_check', with_check
    ) order by tablename, policyname), '[]'::jsonb)
    from pg_policies
    where schemaname = 'public'
  ),
  'functions', (
    select coalesce(jsonb_agg(p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
           order by p.proname), '[]'::jsonb)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ),
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', event_object_table, 'trigger', trigger_name, 'event', event_manipulation
    ) order by event_object_table, trigger_name), '[]'::jsonb)
    from information_schema.triggers
    where trigger_schema = 'public'
  ),
  'admin_or_role_like_tables', (
    select coalesce(jsonb_agg(table_name order by table_name), '[]'::jsonb)
    from information_schema.tables
    where table_schema = 'public'
      and (table_name ilike '%admin%' or table_name ilike '%role%' or table_name ilike '%profile%')
  ),
  'auth_user_count', (select count(*) from auth.users),
  'application_count', (select count(*) from public.course_applications)
) as inspection;
