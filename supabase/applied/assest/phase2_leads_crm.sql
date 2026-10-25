-- PHASE 2: Lead pipeline, notes and communication logs
-- Built from your real schema: course_applications(id uuid PK, full_name, email, phone, course,
-- learning_format, message, created_at, experience_level, occupation, source).
--
-- Prerequisite: phase1_admin_foundation.sql has been applied (roles + audit log).
--
-- What this changes on EXISTING objects (everything else is new):
--   1. ONE new read-only policy on course_applications so staff can read applications.
--      The existing public insert policy is untouched. No update or delete policy is added,
--      so the original application rows can never be edited or removed from the dashboard.
--   2. ONE new trigger on course_applications that creates a lead row for each new
--      application. It is wrapped so that a failure can never block the public form.

begin;

do $$
begin
  if to_regprocedure('public.has_admin_role(text)') is null
     or to_regprocedure('public.audit_row_change()') is null then
    raise exception 'Run phase1_admin_foundation.sql first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. lead_pipeline: one CRM row per application (the original row is never altered)
-- ---------------------------------------------------------------------------
create table if not exists public.lead_pipeline (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique
    references public.course_applications (id) on delete cascade,   -- cascade supports a data-erasure request
  status text not null default 'new'
    check (status in ('unknown', 'new', 'contacted', 'enrolled', 'not_interested')),
  follow_up_date date,
  assigned_to uuid references auth.users (id) on delete set null,
  contacted_at timestamptz,
  contacted_by uuid references auth.users (id) on delete set null,
  -- Applications carry no marketing consent today, so everyone starts as 'unknown'.
  -- Marketing follow-ups (Phase 4) will only ever go to 'granted'.
  marketing_consent text not null default 'unknown'
    check (marketing_consent in ('unknown', 'granted', 'declined')),
  opted_out_at timestamptz,
  opt_out_token uuid not null unique default gen_random_uuid(),     -- for a public unsubscribe link later
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
create index if not exists lead_pipeline_status_idx on public.lead_pipeline (status, follow_up_date);

-- ---------------------------------------------------------------------------
-- 2. lead_notes: internal notes, one row per note, with author and time (cannot be edited)
-- ---------------------------------------------------------------------------
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.course_applications (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_app_idx on public.lead_notes (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. communication_logs: a record of contact. It RECORDS messages staff sent; it sends nothing.
-- ---------------------------------------------------------------------------
create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.course_applications (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'phone', 'sms', 'in_person')),
  message_type text not null
    check (message_type in ('welcome', 'follow_up', 'payment_reminder', 'general', 'marketing')),
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  delivery_status text not null default 'logged'
    check (delivery_status in ('logged', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed')),
  summary text check (char_length(summary) <= 1000),                -- a short summary, not the full message
  contacted_at timestamptz not null default now(),
  staff_id uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists comm_logs_app_idx on public.communication_logs (application_id, contacted_at desc);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    staff, admin and owner can work leads. Viewers cannot see personal data.
--    The public (anon) can do nothing with these tables.
-- ---------------------------------------------------------------------------
alter table public.lead_pipeline enable row level security;
alter table public.lead_notes enable row level security;
alter table public.communication_logs enable row level security;

revoke all on public.lead_pipeline, public.lead_notes, public.communication_logs from anon;
revoke delete, truncate on public.lead_pipeline, public.lead_notes, public.communication_logs from authenticated;
revoke update on public.lead_notes, public.communication_logs from authenticated;   -- append-only

create policy lead_pipeline_staff_read on public.lead_pipeline
  for select to authenticated using (public.has_admin_role('staff'));
create policy lead_pipeline_staff_update on public.lead_pipeline
  for update to authenticated
  using (public.has_admin_role('staff')) with check (public.has_admin_role('staff'));

create policy lead_notes_staff_read on public.lead_notes
  for select to authenticated using (public.has_admin_role('staff'));
create policy lead_notes_staff_insert on public.lead_notes
  for insert to authenticated
  with check (public.has_admin_role('staff') and author_id = auth.uid());

create policy comm_logs_staff_read on public.communication_logs
  for select to authenticated using (public.has_admin_role('staff'));
create policy comm_logs_staff_insert on public.communication_logs
  for insert to authenticated
  with check (public.has_admin_role('staff') and staff_id = auth.uid());

-- EXISTING TABLE, additive: staff can READ applications. Nothing else changes there.
create policy applications_staff_read on public.course_applications
  for select to authenticated using (public.has_admin_role('staff'));

-- ---------------------------------------------------------------------------
-- 5. Server-side rules for lead updates (applied by the database, not the browser)
-- ---------------------------------------------------------------------------
create or replace function public.lead_pipeline_guard()
returns trigger
language plpgsql
as $$
begin
  new.application_id := old.application_id;       -- a lead can never be re-pointed
  new.created_at := old.created_at;
  new.opt_out_token := old.opt_out_token;
  new.updated_at := now();
  new.updated_by := auth.uid();

  if new.follow_up_date is distinct from old.follow_up_date
     and new.follow_up_date is not null
     and new.follow_up_date < public.lagos_today() then
    raise exception 'The follow-up date cannot be in the past.' using errcode = 'P0001';
  end if;

  if new.status = 'contacted' and old.status is distinct from 'contacted' then
    new.contacted_at := coalesce(new.contacted_at, now());
    new.contacted_by := auth.uid();
  end if;

  -- A closed lead has nothing left to follow up.
  if new.status in ('enrolled', 'not_interested') then
    new.follow_up_date := null;
  end if;

  -- An opt-out is permanent here: it cannot be flipped back to consent from the dashboard.
  if old.marketing_consent = 'declined' and new.marketing_consent <> 'declined' then
    raise exception 'A recorded opt-out cannot be reversed.' using errcode = 'P0001';
  end if;
  if new.marketing_consent = 'declined' and old.marketing_consent is distinct from 'declined' then
    new.opted_out_at := now();
  end if;

  return new;
end;
$$;

create trigger lead_pipeline_guard_trg
  before update on public.lead_pipeline
  for each row execute function public.lead_pipeline_guard();

-- Convenience for staff: record that a person asked not to be marketed to.
create or replace function public.record_opt_out(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role('staff') then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  update public.lead_pipeline set marketing_consent = 'declined' where application_id = p_application_id;
end;
$$;
revoke execute on function public.record_opt_out(uuid) from public, anon;
grant execute on function public.record_opt_out(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Audit trail (uses the Phase 1 logger; personal data is never copied into the log)
-- ---------------------------------------------------------------------------
create trigger audit_lead_pipeline
  after insert or update or delete on public.lead_pipeline
  for each row execute function public.audit_row_change(
    'application_id', 'status', 'follow_up_date', 'assigned_to', 'marketing_consent');

create trigger audit_communication_logs
  after insert or update or delete on public.communication_logs
  for each row execute function public.audit_row_change(
    'application_id', 'channel', 'message_type', 'delivery_status', 'direction');

create trigger audit_lead_notes
  after insert or update or delete on public.lead_notes
  for each row execute function public.audit_row_change('application_id');

-- ---------------------------------------------------------------------------
-- 7. Historical applications start as UNKNOWN until an administrator reviews them
-- ---------------------------------------------------------------------------
insert into public.lead_pipeline (application_id, status)
select a.id, 'unknown'
from public.course_applications a
where not exists (select 1 from public.lead_pipeline l where l.application_id = a.id);

-- ---------------------------------------------------------------------------
-- 8. New applications automatically get a lead row (status 'new').
--    The EXCEPTION block means this can never make the public application form fail.
-- ---------------------------------------------------------------------------
create or replace function public.create_lead_for_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.lead_pipeline (application_id, status)
    values (new.id, 'new')
    on conflict (application_id) do nothing;
  exception when others then
    raise warning 'create_lead_for_application failed for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger course_applications_create_lead
  after insert on public.course_applications
  for each row execute function public.create_lead_for_application();

-- Safety net for admins: creates a lead row for any application that somehow has none.
create or replace function public.sync_missing_leads()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if not public.has_admin_role('admin') then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  insert into public.lead_pipeline (application_id, status)
  select a.id, 'new' from public.course_applications a
  where not exists (select 1 from public.lead_pipeline l where l.application_id = a.id);
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.sync_missing_leads() from public, anon;
grant execute on function public.sync_missing_leads() to authenticated;

-- Catch any application that arrived while this migration was running.
insert into public.lead_pipeline (application_id, status)
select a.id, 'new'
from public.course_applications a
where not exists (select 1 from public.lead_pipeline l where l.application_id = a.id);

-- ---------------------------------------------------------------------------
-- 9. lead_overview: one row per lead for the dashboard list.
--    security_invoker makes it obey the policies above, so only staff and above can read it.
-- ---------------------------------------------------------------------------
create or replace view public.lead_overview with (security_invoker = true) as
select
  a.id as application_id,
  a.full_name, a.email, a.phone, a.course, a.learning_format,
  a.experience_level, a.occupation, a.source, a.message,
  a.created_at as applied_at,
  l.status, l.follow_up_date, l.contacted_at, l.assigned_to, l.marketing_consent,
  (select max(c.contacted_at) from public.communication_logs c where c.application_id = a.id) as last_contact_at,
  (select count(*) from public.communication_logs c where c.application_id = a.id) as communication_count,
  (select count(*) from public.lead_notes n where n.application_id = a.id) as note_count
from public.course_applications a
join public.lead_pipeline l on l.application_id = a.id;

revoke all on public.lead_overview from anon;
grant select on public.lead_overview to authenticated;

commit;
