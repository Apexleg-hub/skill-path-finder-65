// supabase/functions/paystack-verify/index.ts
// Asks Paystack what happened to a payment and confirms enrolment only if it truly succeeded.
// The popup's success message is never treated as proof; this function is the check.
import { adminClient, corsHeaders, isUuid, json, verifyAndConfirm } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed." }, 405);

  let body: { pay_token?: unknown; reference?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid request." }, 400);
  }
  const token = body?.pay_token;
  if (!isUuid(token)) return json(req, { error: "Invalid request." }, 400);
  const wanted = typeof body?.reference === "string" ? body.reference.slice(0, 100) : null;

  const db = adminClient();

  const { data: reg } = await db.from("cohort_registrations").select("id").eq("pay_token", token).maybeSingle();
  if (!reg) return json(req, { error: "We could not find this registration." }, 404);

  // Which attempt to check: the one named, or the latest that is not finished. It must belong
  // to this registration, so nobody can probe other people's payments.
  let q = db.from("paystack_payments").select("reference, status").eq("registration_id", reg.id);
  q = wanted ? q.eq("reference", wanted) : q.order("created_at", { ascending: false }).limit(1);
  const { data: attempts } = await q;
  const attempt = attempts?.[0];
  if (!attempt) return json(req, { result: "pending" });

  const result = await verifyAndConfirm(db, attempt.reference);

  // Friendly summary for the page.
  const state =
    result === "confirmed" || result === "already_processed" ? "paid"
    : result === "needs_review" ? "review"
    : result === "provider_error" ? "unavailable"
    : result; // pending | failed | abandoned | not_found
  return json(req, { result: state });
});
