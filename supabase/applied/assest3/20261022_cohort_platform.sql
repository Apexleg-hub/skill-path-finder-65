-- Corepoint Tech Academy: Cohort Training Platform
-- Additive migration. Creates new tables only; does not touch existing production tables.
-- Run in the Supabase SQL editor (or as a migration) after reviewing the notes at the bottom.

begin;

-- ---------------------------------------------------------------------------
-- 0. Admin check
-- If you already have an admin or roles system, replace the body of
-- is_cohort_admin() with a check against it and skip the cohort_admins table.
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.cohort_admins enable row level security;
-- No policies on purpose: only the service role or the SQL editor can manage admins.

create or replace function public.is_cohort_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.cohort_admins where user_id = auth.uid());
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. cohorts
-- ---------------------------------------------------------------------------
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  programme_name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cohort_number integer not null default 1 check (cohort_number > 0),
  title text not null,
  description text,
  about text,
  image_url text,
  category text,
  duration_weeks integer check (duration_weeks > 0),
  start_date date,
  end_date date,
  registration_deadline date,
  learning_format text not null default 'virtual'
    check (learning_format in ('virtual', 'physical', 'hybrid')),
  class_schedule text,
  tuition_fee numeric(12,2) check (tuition_fee >= 0),
  early_bird_fee numeric(12,2) check (early_bird_fee >= 0),
  early_bird_deadline date,
  seat_capacity integer check (seat_capacity > 0),          -- null means no limit
  payment_options text[] not null default '{}',             -- e.g. {'full','instalment'}
  faqs jsonb not null default '[]'::jsonb,                  -- [{"q": "...", "a": "..."}]
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'unpublished')),
  cohort_status text not null default 'coming_soon'
    check (cohort_status in ('coming_soon', 'open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_name, cohort_number),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (early_bird_fee is null or tuition_fee is null or early_bird_fee <= tuition_fee),
  -- A cohort can only be published with the facts needed to sell it.
  check (
    publication_status <> 'published'
    or (start_date is not null and tuition_fee is not null and registration_deadline is not null)
  )
);

create index if not exists cohorts_published_idx
  on public.cohorts (publication_status, start_date);

create trigger cohorts_updated_at
  before update on public.cohorts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. cohort_curriculum
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_curriculum (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  week_number integer not null check (week_number > 0),
  module_title text not null,
  module_description text,
  topics text[] not null default '{}',
  objectives text[] not null default '{}',
  assignment text,
  display_order integer not null default 0
);
create index if not exists cohort_curriculum_cohort_idx
  on public.cohort_curriculum (cohort_id, display_order);

-- ---------------------------------------------------------------------------
-- 3. cohort_registrations
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_registrations (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 20),
  experience_level text not null
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  learning_goal text check (char_length(learning_goal) <= 1000),
  payment_option text,
  registration_reference text not null unique,
  amount_due numeric(12,2) not null check (amount_due >= 0),   -- fee locked in at registration time
  early_bird_applied boolean not null default false,
  consent_given boolean not null check (consent_given),
  consented_at timestamptz not null default now(),
  registration_status text not null default 'registered'
    check (registration_status in ('registered', 'enrolled', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'submitted', 'partially_paid', 'paid', 'rejected')),
  registered_at timestamptz not null default now()
);

-- One registration per email per cohort (case-insensitive).
create unique index if not exists cohort_registrations_unique_email
  on public.cohort_registrations (cohort_id, lower(email));
create index if not exists cohort_registrations_cohort_idx
  on public.cohort_registrations (cohort_id, registration_status);

-- ---------------------------------------------------------------------------
-- 4. cohort_payments
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.cohort_registrations (id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_reference text not null check (char_length(payment_reference) between 3 and 100),
  payment_date date,
  verification_status text not null default 'submitted'
    check (verification_status in ('submitted', 'verified', 'rejected')),
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cohort_payments_registration_idx
  on public.cohort_payments (registration_id);

-- ---------------------------------------------------------------------------
-- 5. Admin-approved bank details (never readable directly by the public)
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  instructions text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.cohorts enable row level security;
alter table public.cohort_curriculum enable row level security;
alter table public.cohort_registrations enable row level security;
alter table public.cohort_payments enable row level security;
alter table public.cohort_payment_accounts enable row level security;

-- Public: read published cohorts and their curriculum only.
create policy cohorts_public_read on public.cohorts
  for select to anon, authenticated
  using (publication_status = 'published');

create policy curriculum_public_read on public.cohort_curriculum
  for select to anon, authenticated
  using (exists (
    select 1 from public.cohorts c
    where c.id = cohort_curriculum.cohort_id and c.publication_status = 'published'
  ));

-- Admins: full access.
create policy cohorts_admin_all on public.cohorts
  for all to authenticated using (public.is_cohort_admin()) with check (public.is_cohort_admin());
create policy curriculum_admin_all on public.cohort_curriculum
  for all to authenticated using (public.is_cohort_admin()) with check (public.is_cohort_admin());
create policy registrations_admin_all on public.cohort_registrations
  for all to authenticated using (public.is_cohort_admin()) with check (public.is_cohort_admin());
create policy payments_admin_all on public.cohort_payments
  for all to authenticated using (public.is_cohort_admin()) with check (public.is_cohort_admin());
create policy payment_accounts_admin_all on public.cohort_payment_accounts
  for all to authenticated using (public.is_cohort_admin()) with check (public.is_cohort_admin());

-- No public policies exist on registrations, payments or payment accounts, so anonymous and
-- ordinary signed-in users cannot read or write them directly. Public writes go only through
-- the SECURITY DEFINER functions below.

-- ---------------------------------------------------------------------------
-- 7. Helper: today's date in Lagos
-- ---------------------------------------------------------------------------
create or replace function public.lagos_today()
returns date
language sql
stable
as $$ select (now() at time zone 'Africa/Lagos')::date; $$;

-- ---------------------------------------------------------------------------
-- 8. Public: seats remaining (counts only, no personal data)
-- Returns null when the cohort has no capacity limit.
-- ---------------------------------------------------------------------------
create or replace function public.cohort_seats_remaining(p_cohort_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case when c.seat_capacity is null then null
    else greatest(c.seat_capacity - (
      select count(*) from public.cohort_registrations r
      where r.cohort_id = c.id and r.registration_status <> 'cancelled'
    ), 0)::integer end
  from public.cohorts c
  where c.id = p_cohort_id and c.publication_status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- 9. Public: register for a cohort
-- The cohort row is locked FOR UPDATE, so concurrent registrations for the same cohort
-- are serialised and the capacity check cannot be raced.
-- ---------------------------------------------------------------------------
create or replace function public.register_for_cohort(
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
  v_taken integer;
  v_fee numeric;
  v_early boolean := false;
  v_ref text;
  v_try integer := 0;
begin
  -- Bots fill hidden fields. Reject without storing anything.
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

  if c.seat_capacity is not null then
    select count(*) into v_taken
    from public.cohort_registrations
    where cohort_id = c.id and registration_status <> 'cancelled';
    if v_taken >= c.seat_capacity then
      raise exception 'This cohort is full.' using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1 from public.cohort_registrations
    where cohort_id = c.id and lower(email) = v_email
  ) then
    raise exception 'This email is already registered for this cohort.' using errcode = 'P0001';
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

  loop
    v_ref := 'CPT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.cohort_registrations (
        cohort_id, full_name, email, phone, experience_level, learning_goal,
        payment_option, registration_reference, amount_due, early_bird_applied, consent_given
      ) values (
        c.id, trim(p_full_name), v_email, trim(p_phone), p_experience_level,
        nullif(trim(p_learning_goal), ''), p_payment_option, v_ref, v_fee, v_early, true
      );
      exit;
    exception
      when unique_violation then
        -- Either the reference collided (retry) or a duplicate email slipped past the check.
        if exists (select 1 from public.cohort_registrations
                   where cohort_id = c.id and lower(email) = v_email) then
          raise exception 'This email is already registered for this cohort.' using errcode = 'P0001';
        end if;
        v_try := v_try + 1;
        if v_try > 5 then raise; end if;
    end;
  end loop;

  return query
    select v_ref, v_fee, v_early, a.bank_name, a.account_name, a.account_number, a.instructions
    from (select 1) x
    left join lateral (
      select * from public.cohort_payment_accounts
      where is_active order by created_at desc limit 1
    ) a on true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Public: submit payment details for later verification
-- Requires the registration reference AND the registration email.
-- Never marks anything as paid.
-- ---------------------------------------------------------------------------
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
    update public.cohort_registrations set payment_status = 'submitted' where id = r.id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Admin: verify or reject a payment and recompute the registration
-- ---------------------------------------------------------------------------
create or replace function public.verify_cohort_payment(p_payment_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg uuid;
  v_due numeric;
  v_verified numeric;
  v_pending integer;
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  update public.cohort_payments
  set verification_status = case when p_approve then 'verified' else 'rejected' end,
      verified_by = auth.uid(),
      verified_at = now()
  where id = p_payment_id
  returning registration_id into v_reg;

  if v_reg is null then
    raise exception 'Payment not found.' using errcode = 'P0001';
  end if;

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
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. Admin: dashboard metrics (revenue comes from verified payments only)
-- ---------------------------------------------------------------------------
create or replace function public.cohort_admin_metrics()
returns table (
  published_cohorts bigint,
  open_cohorts bigint,
  total_registrations bigint,
  verified_paid_students bigint,
  outstanding_amount numeric,
  verified_revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_cohort_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.cohorts where publication_status = 'published'),
    (select count(*) from public.cohorts
       where publication_status = 'published' and cohort_status = 'open'
         and registration_deadline >= public.lagos_today()),
    (select count(*) from public.cohort_registrations where registration_status <> 'cancelled'),
    (select count(*) from public.cohort_registrations where payment_status = 'paid'),
    (select coalesce(sum(r.amount_due - coalesce(p.verified, 0)), 0)
       from public.cohort_registrations r
       left join (select registration_id, sum(amount) as verified
                  from public.cohort_payments where verification_status = 'verified'
                  group by registration_id) p on p.registration_id = r.id
       where r.registration_status <> 'cancelled' and r.amount_due > coalesce(p.verified, 0)),
    (select coalesce(sum(amount), 0) from public.cohort_payments where verification_status = 'verified');
end;
$$;

-- ---------------------------------------------------------------------------
-- 13. Function privileges
-- ---------------------------------------------------------------------------
revoke all on function public.register_for_cohort(text,text,text,text,text,text,text,boolean,text) from public;
revoke all on function public.submit_cohort_payment(text,text,numeric,text,date) from public;
revoke all on function public.verify_cohort_payment(uuid,boolean) from public;
revoke all on function public.cohort_admin_metrics() from public;
revoke all on function public.cohort_seats_remaining(uuid) from public;

grant execute on function public.register_for_cohort(text,text,text,text,text,text,text,boolean,text) to anon, authenticated;
grant execute on function public.submit_cohort_payment(text,text,numeric,text,date) to anon, authenticated;
grant execute on function public.cohort_seats_remaining(uuid) to anon, authenticated;
grant execute on function public.verify_cohort_payment(uuid,boolean) to authenticated;
grant execute on function public.cohort_admin_metrics() to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- NOTES
-- 1. Add yourself as an admin after running (replace the email):
--      insert into public.cohort_admins (user_id)
--      select id from auth.users where email = 'you@example.com';
-- 2. Add and activate your real bank details only when approved:
--      insert into public.cohort_payment_accounts (bank_name, account_name, account_number, is_active)
--      values ('...', '...', '...', true);
-- 3. Registration references use gen_random_uuid(), which is built in (no extension needed).
-- 4. Spam protection: call register_for_cohort from a server function or edge function that
--    verifies a Cloudflare Turnstile or hCaptcha token and rate-limits by IP before calling the
--    database. The honeypot and validation here are a second layer, not a replacement.
-- 5. Seeding: do not insert sample cohorts. Create real ones from the admin dashboard, as drafts
--    first. The CHECK constraint blocks publishing without a start date, fee and deadline.
-- ---------------------------------------------------------------------------
