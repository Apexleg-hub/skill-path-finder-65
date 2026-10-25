-- PHASE 1: Admin foundation (roles, authorisation helpers, audit log)
-- Additive. Does NOT touch course_applications or any existing table.
-- Prerequisite: 20261022_cohort_platform.sql has already been run (this replaces its
-- is_cohort_admin() function so cohort admins and the new roles work together).

begin;

-- ---------------------------------------------------------------------------
-- 1. admin_roles: who is an administrator, and at what level
--    owner  : everything, including managing other admins
--    admin  : manage cohorts, leads, payments, view audit logs
--    staff  : work leads and follow-ups (Phase 2 onwards)
--    viewer : read-only
-- A signed-in user with no row here has NO admin access, whatever they do in the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff', 'viewer')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);
alter table public.admin_roles enable row level security;

create or replace function public.admin_role_rank(r text)
returns integer
language sql
immutable
as $$
  select case r when 'owner' then 4 when 'admin' then 3 when 'staff' then 2 when 'viewer' then 1 else 0 end;
$$;

-- SECURITY DEFINER so policies on admin_roles itself can call it without recursion.
create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_roles where user_id = auth.uid();
$$;

create or replace function public.has_admin_role(p_min text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role_rank(public.current_admin_role()) >= public.admin_role_rank(p_min);
$$;

-- Keep the cohort policies working: owners and admins, or anyone already in cohort_admins.
create or replace function public.is_cohort_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_admin_role('admin')
      or exists (select 1 from public.cohort_admins where user_id = auth.uid());
$$;

-- A signed-in user can read only their own role (the site needs this to decide what to show).
create policy admin_roles_self_read on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid());

-- Only owners can add, change or remove admins.
create policy admin_roles_owner_all on public.admin_roles
  for all to authenticated
  using (public.has_admin_role('owner'))
  with check (public.has_admin_role('owner'));

revoke all on public.admin_roles from anon;

-- ---------------------------------------------------------------------------
-- 2. audit_logs: who changed what, and when
--    Stores table, row id, action, which columns changed, and values for a short
--    allow-list of NON-personal columns only (statuses, amounts, dates).
--    Names, emails and phone numbers are never copied into the log.
--    Append-only: updates and deletes are blocked.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text,
  action text not null,
  table_name text not null,
  row_id text,
  changed_columns text[],
  old_values jsonb,
  new_values jsonb
);
create index if not exists audit_logs_time_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_table_idx on public.audit_logs (table_name, row_id);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.has_admin_role('admin'));

create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end;
$$;

create trigger audit_logs_no_change
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- Generic row-change logger. Trigger arguments are the allow-listed columns whose values
-- may be stored.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  keys text[] := tg_argv;
  o jsonb := '{}'::jsonb;
  n jsonb := '{}'::jsonb;
  changed text[];
  rid text;
begin
  if tg_op = 'INSERT' then
    n := to_jsonb(new);
    rid := n ->> 'id';
  elsif tg_op = 'DELETE' then
    o := to_jsonb(old);
    rid := o ->> 'id';
  else
    o := to_jsonb(old);
    n := to_jsonb(new);
    rid := n ->> 'id';
    select array_agg(e.k) into changed
    from jsonb_each(n) as e(k, v)
    where e.k <> 'updated_at' and e.v is distinct from (o -> e.k);
    if changed is null then
      return new;                      -- nothing meaningful changed
    end if;
  end if;

  insert into public.audit_logs (actor_id, actor_role, action, table_name, row_id,
                                 changed_columns, old_values, new_values)
  values (
    auth.uid(),
    public.current_admin_role(),
    tg_op,
    tg_table_name,
    rid,
    changed,
    (select jsonb_object_agg(e.k, e.v) from jsonb_each(o) as e(k, v) where e.k = any (keys)),
    (select jsonb_object_agg(e.k, e.v) from jsonb_each(n) as e(k, v) where e.k = any (keys))
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Attach to the cohort tables and to the roles table.
create trigger audit_cohorts
  after insert or update or delete on public.cohorts
  for each row execute function public.audit_row_change(
    'programme_name', 'publication_status', 'cohort_status', 'tuition_fee',
    'early_bird_fee', 'seat_capacity', 'start_date', 'registration_deadline');

create trigger audit_cohort_registrations
  after insert or update or delete on public.cohort_registrations
  for each row execute function public.audit_row_change(
    'cohort_id', 'registration_status', 'payment_status', 'amount_due');

create trigger audit_cohort_payments
  after insert or update or delete on public.cohort_payments
  for each row execute function public.audit_row_change(
    'registration_id', 'amount', 'verification_status', 'verified_by');

create trigger audit_admin_roles
  after insert or update or delete on public.admin_roles
  for each row execute function public.audit_row_change('role');

commit;

-- ---------------------------------------------------------------------------
-- AFTER RUNNING
-- 1. Create your admin login in the Supabase dashboard: Authentication > Users > Add user
--    (tick "Auto confirm user"), then make that user the owner:
--      insert into public.admin_roles (user_id, role)
--      select id, 'owner' from auth.users where email = 'YOUR-EMAIL';
-- 2. Turn OFF public sign-ups: Authentication > Sign In / Providers > "Allow new users to sign up".
--    Even if this were left on, a new account has no row in admin_roles and sees nothing.
-- 3. Add more admins the same way (create the user, then insert a row with the role you want).
-- ---------------------------------------------------------------------------
