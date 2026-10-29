# Paystack setup and testing (test mode only)

Nothing here uses live keys. Do not switch to live mode until you have approved it.

## 1. Check the database

Run `phase4_tests.sql` in the Supabase SQL Editor. Every line should start with PASS.
It rolls back, so no test data remains.

## 2. Install the Supabase CLI and link your project

```
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Your project reference is the code in your Supabase dashboard address, for example
`https://supabase.com/dashboard/project/abcdefghijklmnop`.

## 3. Add the functions to your project

Copy the `supabase` folder from the files you were given into the root of your website project,
so you have:

```
supabase/functions/_shared/common.ts
supabase/functions/paystack-initialize/index.ts
supabase/functions/paystack-verify/index.ts
supabase/functions/paystack-webhook/index.ts
```

## 4. Store the Paystack TEST secret key safely

Get the test secret key from Paystack: switch the dashboard to Test mode, then
Settings, API Keys and Webhooks. It starts with `sk_test_`.

```
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY PAYSTACK_MODE=test SITE_URL=https://corepointtech.com.ng
```

Never put the secret key in your website code, a `.env` file that is committed, or chat. If it is
ever exposed, generate a new one in the Paystack dashboard.

To also allow local testing, the functions already accept `http://localhost:3000` and
`http://localhost:5173`. To change the allowed sites:
`supabase secrets set ALLOWED_ORIGINS=https://corepointtech.com.ng,http://localhost:3000`

## 5. Deploy

```
supabase functions deploy paystack-initialize --no-verify-jwt
supabase functions deploy paystack-verify --no-verify-jwt
supabase functions deploy paystack-webhook --no-verify-jwt
```

`--no-verify-jwt` is needed for the webhook because Paystack cannot send a Supabase login token.
The other two use the student's private payment token as their credential, and the amount always
comes from the database.

Your function addresses are:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-initialize
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-verify
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

## 6. Register the webhook in Paystack (test mode)

Paystack dashboard, Test mode, Settings, API Keys and Webhooks. Set the **Test Webhook URL** to
the `paystack-webhook` address above and save.

## 7. Test the functions before the page exists

First get a payment token for a test registration. In the SQL Editor, register through the same
function the website uses (the Data Analysis cohort must be published and open):

```sql
select registration_reference, pay_token
from public.register_for_cohort('data-analysis-cohort-1', 'Test Student', 'your-own-email@example.com',
  '+2348012345678', 'beginner', 'Testing payments', 'full', true, null);
```

Then start a payment (replace the project reference and the token):

```
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-initialize \
  -H "Content-Type: application/json" \
  -d '{"pay_token":"PASTE_TOKEN_HERE"}'
```

You should get back `"status":"ready"`, an `access_code`, a `reference` and an
`authorization_url`. The amount is 4500000 kobo.

Open the `authorization_url` in a browser and pay with a test card from Paystack's documentation
(search "Paystack test cards"). Then check what happened:

```
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-verify \
  -H "Content-Type: application/json" \
  -d '{"pay_token":"PASTE_TOKEN_HERE"}'
```

Expected: `{"result":"paid"}`. Then in the SQL Editor:

```sql
select reference, status, amount_kobo, review_reason from public.paystack_payments order by created_at desc;
select event, signature_valid, result from public.payment_events order by received_at desc;
select payment_status, registration_status from public.cohort_registrations
  where email = 'your-own-email@example.com';
```

You should see the payment as `success`, a webhook event with `signature_valid = true`, and the
registration as `paid` and `enrolled`.

## 8. Check the security rules

A request with a bad signature must be rejected:

```
curl -i -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook \
  -H "x-paystack-signature: not-a-real-signature" \
  -d '{"event":"charge.success","data":{"reference":"PSK-FAKE"}}'
```

Expected: `401 invalid signature`, and nothing changes in your tables.

Paying twice should be refused: run the initialize command again for the same token. Expected:
`"status":"paid"`.

## If something fails

- `PAYSTACK_SECRET_KEY is not set`: run the `supabase secrets set` command again, then redeploy.
- `We could not find this registration`: the token is wrong or from a different project.
- A 500 error: open Supabase, Edge Functions, choose the function, then Logs. Send me the message
  (never the secret key).
- If `SUPABASE_SERVICE_ROLE_KEY` is reported missing, tell me. Newer Supabase projects may name
  their keys differently and I will adjust `_shared/common.ts`.

## 9. Emails (Resend)

The site queues two emails per student: "Registration Received" and "Payment Confirmed". They are
sent through Resend from info@corepointtech.com.ng. A failed email never affects a payment; it is
recorded and retried.

1. Create a free account at resend.com.
2. In Resend, add the domain `corepointtech.com.ng` (Domains, Add Domain). Resend shows DNS records
   (SPF, DKIM). Add them where your domain's DNS is managed (your domain registrar or host), then
   click Verify in Resend. Keep any existing mail records you already have. A domain can have only
   ONE SPF record, so if you already have one, merge Resend's include into it instead of adding a
   second.
3. Create an API key in Resend (API Keys, Create). It starts with `re_`.
4. Set the secrets (type your own key in your terminal, never in chat):

```
npx supabase secrets set RESEND_API_KEY=re_YOUR_KEY EMAIL_FROM="Corepoint Tech Academy <info@corepointtech.com.ng>" EMAIL_REPLY_TO=info@corepointtech.com.ng ADMIN_NOTIFY_EMAIL=your-notification-address@gmail.com EMAIL_CRON_SECRET=a-long-random-string
```

5. Deploy the functions again, including the new `send-emails`:

```
npx supabase functions deploy paystack-initialize --no-verify-jwt
npx supabase functions deploy paystack-verify --no-verify-jwt
npx supabase functions deploy paystack-webhook --no-verify-jwt
npx supabase functions deploy send-emails --no-verify-jwt
```

6. Test: register with your own email. You should receive "Registration Received". After a test
   payment you should receive "Payment Confirmed" (and the notification address gets a blind copy).
   Check `select kind, status, last_error from public.email_outbox order by created_at desc;`.

To retry anything that failed:
`curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails -H "Authorization: Bearer YOUR_EMAIL_CRON_SECRET"`

Until the domain is verified in Resend, sending from info@corepointtech.com.ng is refused and the
emails stay queued. They send automatically once verification is complete.
