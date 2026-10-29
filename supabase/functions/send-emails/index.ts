// supabase/functions/paystack-initialize/index.ts
// Starts a Paystack payment for a saved registration.
// The browser sends ONLY the private pay_token. The amount, email and cohort come from the database.
import { adminClient, corsHeaders, isUuid, json, paidResults, paystack, runInBackground, sendQueuedEmails, SITE_URL, verifyAndConfirm } from "../_shared/common.ts";

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed." }, 405);

  let body: { pay_token?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid request." }, 400);
  }
  const token = body?.pay_token;
  if (!isUuid(token)) return json(req, { error: "Invalid request." }, 400);

  const db = adminClient();

  const { data: reg, error: regError } = await db
    .from("cohort_registrations")
    .select("id, payment_status, registration_status")
    .eq("pay_token", token)
    .maybeSingle();
  if (regError) {
    console.error("registration lookup failed:", regError.code, regError.message);
    return json(req, { error: "Something went wrong. Please try again." }, 500);
  }
  if (!reg) return json(req, { error: "We could not find this registration." }, 404);
  if (reg.registration_status === "cancelled") {
    return json(req, { error: "This registration was cancelled. Please register again." }, 400);
  }
  if (reg.payment_status === "paid" || reg.registration_status === "enrolled") {
    return json(req, { status: "paid" });
  }

  // Before creating a new attempt, check whether an earlier one actually succeeded,
  // so the student is never charged twice.
  const { data: earlier } = await db
    .from("paystack_payments")
    .select("reference")
    .eq("registration_id", reg.id)
    .in("status", ["initialized", "pending"])
    .order("created_at", { ascending: false })
    .limit(3);
  for (const e of earlier ?? []) {
    const result = await verifyAndConfirm(db, e.reference);
    if (paidResults.includes(result)) return json(req, { status: "paid" });
  }

  const reference = `PSK-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

  // Checks the deadline, seats and rate limit, and stores the tuition snapshot in kobo.
  const { data: prepared, error: prepError } = await db.rpc("paystack_prepare_attempt", {
    p_pay_token: token,
    p_reference: reference,
  });
  if (prepError) {
    if (prepError.code === "P0001") return json(req, { error: prepError.message }, 400);
    console.error("prepare failed:", prepError.code, prepError.message);
    return json(req, { error: "Something went wrong. Please try again." }, 500);
  }
  const p = Array.isArray(prepared) ? prepared[0] : prepared;
  if (!p) return json(req, { error: "Something went wrong. Please try again." }, 500);

  let res: Response;
  try {
    res = await paystack("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: p.o_email,
        amount: p.o_amount_kobo,                 // kobo, from the database
        currency: "NGN",
        reference,
        callback_url: `${SITE_URL}/cohorts/${p.o_cohort_slug}/register?ref=${encodeURIComponent(reference)}`,
        metadata: {
          registration_id: p.o_registration_id,
          registration_reference: p.o_registration_reference,
          cohort_slug: p.o_cohort_slug,
          payment_id: p.o_payment_id,
        },
      }),
    });
  } catch {
    await db.from("paystack_payments").update({ status: "failed", gateway_response: "Could not reach Paystack" }).eq("id", p.o_payment_id);
    return json(req, { error: "The payment service is temporarily unavailable. Please try again shortly." }, 502);
  }

  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.status || !out?.data?.access_code) {
    await db.from("paystack_payments").update({ status: "failed", gateway_response: String(out?.message ?? "Initialize failed").slice(0, 300) }).eq("id", p.o_payment_id);
    return json(req, { error: "We could not start the payment. Please try again shortly." }, 502);
  }

  await db.from("paystack_payments").update({ access_code: out.data.access_code, updated_at: new Date().toISOString() }).eq("id", p.o_payment_id);

  runInBackground(sendQueuedEmails(db));     // "registration received" email; never delays the payment

  // Only what the page needs.
  return json(req, {
    status: "ready",
    access_code: out.data.access_code,
    authorization_url: out.data.authorization_url,   // used only if the popup fails to load
    reference,
    amount_kobo: p.o_amount_kobo,
  });
}

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    // Shows up in the function's Logs tab in the Supabase dashboard.
    console.error("paystack-initialize crashed:", e instanceof Error ? e.message : String(e));
    return json(req, { error: "Something went wrong. Please try again." }, 500);
  }
});

