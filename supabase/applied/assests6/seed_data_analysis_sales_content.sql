-- Starter content for the Data Analysis cohort sales page. Run AFTER phase6_cohort_sales_page.sql.
-- Everything below is editable later in /admin/cohorts. Read it and change anything that is not true
-- for your programme. The meta description contains the start date and price: update it if they change.

update public.cohorts set
  tagline = 'Learn Excel, SQL and Power BI in 8 weeks, and build practical data analysis skills with live, instructor-led training.',
  why_text = 'Businesses of every size collect data, but many struggle to turn it into decisions. A data analyst cleans, analyses and presents data so that managers can act on it.

This 8-week cohort teaches three widely used tools for that work: Excel, SQL and Power BI. You learn step by step, with live sessions and practice on business-style datasets, so that you can clean data, answer questions with it and present your findings clearly.',
  audience = array[
    'Beginners who are interested in data analytics',
    'Graduates who want practical, employable skills',
    'Professionals moving into technology',
    'Business owners who want data-driven insights',
    'Anyone interested in business intelligence and reporting'
  ],
  not_for = array[
    'People looking for advanced machine learning or deep software engineering. This cohort focuses on data analysis with Excel, SQL and Power BI.',
    'People who cannot set aside time each week for live sessions and practice.'
  ],
  included = array[
    'Live instructor-led online sessions',
    'Practical assignments',
    'Real-world style projects and datasets',
    'Learning resources',
    'Student support community',
    'Certificate of completion, subject to assessment requirements'
  ],
  faqs = '[
    {"q": "Do I need any experience to join?", "a": "No. The cohort starts from the basics and builds up step by step, so beginners are welcome."},
    {"q": "What do I need to take part?", "a": "A laptop or computer and a reliable internet connection for the live online sessions."},
    {"q": "How do I pay?", "a": "Tuition is paid in full online with Paystack when you register. Your place is confirmed once the payment is verified."},
    {"q": "Will I get a certificate?", "a": "Yes. A certificate of completion is awarded, subject to the assessment requirements."}
  ]'::jsonb,
  seo_title = 'Data Analysis Course in Nigeria: Excel, SQL & Power BI',
  seo_description = '8-week live online Data Analysis cohort in Nigeria. Learn Excel, SQL and Power BI with practical projects. Starts 23 Nov 2026. Register now.'
where slug = 'data-analysis-cohort-1';

select slug, char_length(seo_title) as title_chars, char_length(seo_description) as description_chars
from public.cohorts where slug = 'data-analysis-cohort-1';
