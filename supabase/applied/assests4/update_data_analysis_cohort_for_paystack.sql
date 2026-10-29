-- Sets the Data Analysis cohort to the details for Paystack payment.
-- Run AFTER phase4_paystack_core.sql. Check every value before you run it.
-- It does not publish or open registration; do that from /admin/cohorts when you are ready.

update public.cohorts set
  programme_name        = 'Data Analysis',
  title                 = 'Data Analysis Cohort: Excel, SQL & Power BI',
  duration_weeks        = 8,
  start_date            = '2026-11-23',
  end_date              = '2027-01-17',          -- 8 weeks after the start date; change if your schedule differs
  registration_deadline = '2026-11-20',
  payment_deadline      = '2026-11-20',          -- proposed; confirm
  tuition_fee           = 45000,                 -- naira; the page and Paystack both read this value
  early_bird_fee        = null,
  early_bird_deadline   = null,
  payment_options       = array['full'],         -- full payment only
  seat_hold_hours       = 48                     -- how long an unpaid registration keeps its seat
where slug = 'data-analysis-cohort-1';

-- Check the result:
select slug, title, start_date, registration_deadline, payment_deadline, tuition_fee, payment_options
from public.cohorts where slug = 'data-analysis-cohort-1';
