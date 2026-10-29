// supabase/functions/_shared/email.ts
// Sends the queued emails (registration received, payment confirmed) through Resend.
// Secrets (set with `supabase secrets set`):
//   RESEND_API_KEY      your Resend API key
//   EMAIL_FROM          e.g.  Corepoint Tech Academy <info@corepointtech.com.ng>
//   EMAIL_REPLY_TO      e.g.  info@corepointtech.com.ng
//   ADMIN_NOTIFY_EMAIL  optional: gets a blind copy of every payment confirmation
//   SITE_URL            default https://corepointtech.com.ng
// A failed email never affects a payment. It is recorded and retried the next time this runs.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = (Deno.env.get("SITE_URL") ?? "https://corepointtech.com.ng").replace(/\/$/, "");
const MAX_ATTEMPTS = 5;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const day = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "To be confirmed";

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td><h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>${bodyHtml}
<p style="margin:24px 0 0;font-size:12px;color:#666">Corepoint Tech Academy, owned and managed by Equalline Limited.<br>Questions? Reply to this email or write to info@corepointtech.com.ng.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:6px 0;color:#666;width:42%">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`;

type Ctx = {
  name: string; reference: string; amountDue: number; token: string; paymentStatus: string;
  cohortTitle: string; slug: string; startDate: string | null; payBy: string | null;
  paidReference: string | null; paidAt: string | null;
};

function registrationReceived(c: Ctx) {
  const link = `${SITE}/cohorts/${c.slug}/register?resume=${c.token}`;
  const html = wrap("Registration received", `
<p>Hi ${esc(c.name.split(" ")[0])},</p>
<p>Thank you for registering for <strong>${esc(c.cohortTitle)}</strong>. We have saved your registration.</p>
<table role="presentation" width="100%" style="font-size:14px">${row("Registration reference", c.reference)}${row("Tuition", naira(c.amountDue))}${row("Start date", day(c.startDate))}${row("Pay by", day(c.payBy))}</table>
<p><strong>Your enrolment is not confirmed yet.</strong> It is confirmed after your full tuition payment is verified.</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#0a7a4b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Complete your payment</a></p>
<p style="font-size:12px;color:#666">This link is private to you. If the button does not work, open the registration page and choose "Continue my registration" with your reference.</p>`);
  const text = `Hi ${c.name.split(" ")[0]},\n\nWe have saved your registration for ${c.cohortTitle}.\nReference: ${c.reference}\nTuition: ${naira(c.amountDue)}\nStart date: ${day(c.startDate)}\nPay by: ${day(c.payBy)}\n\nYour enrolment is not confirmed until your full tuition payment is verified.\nComplete your payment: ${link}\n\nCorepoint Tech Academy`;
  return { subject: "Corepoint Tech Academy: Registration Received", html, text };
}

function paymentConfirmed(c: Ctx) {
  const html = wrap("Payment confirmed", `
<p>Hi ${esc(c.name.split(" ")[0])},</p>
<p>Welcome to Corepoint Tech Academy. Your payment has been confirmed and your enrolment is <strong>confirmed</strong>.</p>
<table role="presentation" width="100%" style="font-size:14px">${row("Cohort", c.cohortTitle)}${row("Amount paid", naira(c.amountDue))}${row("Transaction reference", c.paidReference ?? "")}${row("Payment date", day(c.paidAt))}${row("Cohort start date", day(c.startDate))}${row("Enrolment status", "Confirmed")}</table>
<p><strong>Next steps:</strong> our team will send your onboarding instructions and class details to this email address and your WhatsApp number before the cohort starts. Please keep this email as your receipt.</p>`);
  const text = `Hi ${c.name.split(" ")[0]},\n\nYour payment is confirmed and your enrolment in ${c.cohortTitle} is confirmed.\nAmount paid: ${naira(c.amountDue)}\nTransaction reference: ${c.paidReference ?? ""}\nPayment date: ${day(c.paidAt)}\nStart date: ${day(c.startDate)}\n\nOur team will send onboarding instructions before the cohort starts. Keep this email as your receipt.\n\nCorepoint Tech Academy`;
  return { subject: "Payment Confirmed: Welcome to Corepoint Tech Academy", html, text };
}

export async function sendQueuedEmails(db: SupabaseClient): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;                                     // emails stay queued until a key is set
  const from = Deno.env.get("EMAIL_FROM") ?? "Corepoint Tech Academy <info@corepointtech.com.ng>";
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") ?? "info@corepointtech.com.ng";
  const adminCopy = Deno.env.get("ADMIN_NOTIFY_EMAIL");

  const { data: queue } = await db
    .from("email_outbox")
    .select("id, registration_id, kind, to_email, status, attempts")
    .in("status", ["queued", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(10);

  for (const item of queue ?? []) {
    // Claim the row so two runs at once cannot send the same email twice.
    const { data: claimed } = await db
      .from("email_outbox")
      .update({ attempts: item.attempts + 1 })
      .eq("id", item.id).eq("attempts", item.attempts).in("status", ["queued", "failed"])
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    try {
      const { data: reg } = await db.from("cohort_registrations")
        .select("full_name, registration_reference, amount_due, payment_status, pay_token, cohort_id")
        .eq("id", item.registration_id).single();
      if (!reg) throw new Error("registration missing");
      const { data: c } = await db.from("cohorts")
        .select("title, slug, start_date, payment_deadline, registration_deadline")
        .eq("id", reg.cohort_id).single();
      if (!c) throw new Error("cohort missing");
      const { data: pay } = await db.from("paystack_payments")
        .select("reference, paid_at").eq("registration_id", item.registration_id).eq("status", "success").maybeSingle();

      const ctx: Ctx = {
        name: reg.full_name, reference: reg.registration_reference, amountDue: Number(reg.amount_due),
        token: reg.pay_token, paymentStatus: reg.payment_status, cohortTitle: c.title, slug: c.slug,
        startDate: c.start_date, payBy: c.payment_deadline ?? c.registration_deadline,
        paidReference: pay?.reference ?? null, paidAt: pay?.paid_at ?? null,
      };

      // No point asking someone to pay if they already have.
      if (item.kind === "registration_received" && ctx.paymentStatus === "paid") {
        await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: "skipped: already paid" }).eq("id", item.id);
        continue;
      }

      const mail = item.kind === "payment_confirmed" ? paymentConfirmed(ctx) : registrationReceived(ctx);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: [item.to_email], reply_to: replyTo, subject: mail.subject, html: mail.html, text: mail.text,
          ...(item.kind === "payment_confirmed" && adminCopy ? { bcc: [adminCopy] } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(`Resend ${res.status}: ${String(body?.message ?? "error").slice(0, 150)}`);
      }
      await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", item.id);
    } catch (e) {
      // Recorded for retry. The payment and enrolment are not affected.
      await db.from("email_outbox").update({ status: "failed", last_error: (e instanceof Error ? e.message : "unknown").slice(0, 200) }).eq("id", item.id);
    }
  }
}
