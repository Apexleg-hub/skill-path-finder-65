-- PHASE 0: read-only inspection of your existing Supabase schema.
-- Run each block in the Supabase SQL Editor and paste the RESULTS back (not student data).
-- These queries only read metadata and row counts. They change nothing.

-- 1. Columns of course_applications (names, types, nullability, defaults)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'course_applications'
order by ordinal_position;

-- 2. Primary key and other constraints on course_applications
select conname as constraint_name, contype as type, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.course_applications'::regclass;

-- 3. Indexes on course_applications
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'course_applications';

-- 4. Is Row Level Security on, and what policies exist, for every public table?
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. Existing functions and triggers (to find any current admin check)
select p.proname as function_name, pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

select event_object_table as table_name, trigger_name, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 6. Any existing admin or role tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and (table_name ilike '%admin%' or table_name ilike '%role%' or table_name ilike '%profile%')
order by table_name;

-- 7. How many applications exist (a number only)
select count(*) as application_count from public.course_applications;

-- 8. Auth settings are not in SQL. Please also check in the Supabase dashboard:
--    Authentication > Sign In / Providers: is "Allow new users to sign up" ON or OFF?
--    Authentication > Users: how many users exist and who are they (just tell me the count)?
