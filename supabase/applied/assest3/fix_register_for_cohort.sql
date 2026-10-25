-- FIX: register_for_cohort used gen_random_bytes (pgcrypto), which the function's locked
-- search_path cannot see on Supabase, so every public cohort registration failed.
-- This replaces the function with a version that uses the built-in gen_random_uuid().
-- Behaviour is otherwise identical. Existing permissions on the function are kept.
-- Safe to run more than once.

begin;

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

commit;
