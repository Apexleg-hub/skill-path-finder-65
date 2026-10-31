// supabase/functions/send-emails/index.ts
// Sends any queued or failed emails now. Normally the payment functions do this automatically;
// call this yourself to retry after fixing an email problem. Protected by EMAIL_CRON_SECRET.
//   supabase secrets set EMAIL_CRON_SECRET=a-long-random-string
//   curl -X POST https://YOUR_REF.supabase.co/functions/v1/send-emails -H "Authorization: Bearer a-long-random-string"
import { adminClient } from "../_shared/common.ts";
import { sendQueuedEmails } from "../_shared/email.ts";

Deno.serve(async (req) => {
  const secret = Deno.env.get("EMAIL_CRON_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sendQueuedEmails(adminClient());
  return new Response("ok");
});
