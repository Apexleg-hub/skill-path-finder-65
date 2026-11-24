-- COHORT SALES PAGE: editable content and SEO fields
-- Run in the Supabase SQL Editor. Adds columns to public.cohorts only. Nothing existing changes.
-- These are the fields you edit in /admin/cohorts, under "Sales page and SEO".

begin;

alter table public.cohorts
  add column if not exists tagline text,
  add column if not exists why_text text,
  add column if not exists audience text[] not null default '{}',
  add column if not exists not_for text[] not null default '{}',
  add column if not exists included text[] not null default '{}',
  add column if not exists seo_title text,
  add column if not exists seo_description text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cohorts_sales_fields_check') then
    alter table public.cohorts add constraint cohorts_sales_fields_check check (
      (tagline is null or char_length(tagline) <= 200)
      and (why_text is null or char_length(why_text) <= 3000)
      and (seo_title is null or char_length(seo_title) <= 70)
      and (seo_description is null or char_length(seo_description) <= 200)
      and cardinality(audience) <= 20
      and cardinality(not_for) <= 20
      and cardinality(included) <= 20
    );
  end if;
end $$;

commit;
