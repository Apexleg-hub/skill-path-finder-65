// supabase/functions/paystack-webhook/index.ts
// Receives Paystack events. Deploy with --no-verify-jwt (Paystack cannot send a Supabase token).
// Security: the x-paystack-signature header is checked against the RAW body with HMAC-SHA512 and
// your secret key. Anything with a bad signature is rejected. A good event is not trusted either:
// the transaction is re-verified with Paystack and processed by the same database function the
// verify endpoint uses, so a repeated or early event can never enrol anyone twice.
import { adminClient, verifyAndConfirm } from "../_shared/common.ts";

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares without leaking where the strings differ.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) return new Response("not configured", { status: 500 });

  const raw = await req.text();             // the exact bytes Paystack signed
  const provided = (req.headers.get("x-paystack-signature") ?? "").toLowerCase();
  const expected = await hmacSha512Hex(secret, raw);
  const valid = provided.length > 0 && safeEqual(provided, expected);

  const db = adminClient();

  let payload: { event?: string; data?: { reference?: string } } | null = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }
  const event = payload?.event ?? null;
  const reference = payload?.data?.reference ?? null;

  if (!valid) {
    // Record the attempt without storing the body of an unauthenticated request.
    await db.from("payment_events").insert({ event, reference, signature_valid: false, result: "rejected" });
    return new Response("invalid signature", { status: 401 });
  }

  let result = "ignored";
  if (event === "charge.success" && typeof reference === "string") {
    result = await verifyAndConfirm(db, reference);
  }

  // Store a trimmed copy of the event: no card details.
  const d = (payload?.data ?? {}) as Record<string, unknown>;
  await db.from("payment_events").insert({
    event, reference, signature_valid: true, result,
    payload: { id: d.id, reference: d.reference, status: d.status, amount: d.amount, currency: d.currency, channel: d.channel, paid_at: d.paid_at },
  });

  // 500 asks Paystack to retry later (Paystack was unreachable). Everything else is acknowledged.
  if (result === "provider_error") return new Response("retry", { status: 500 });
  return new Response("ok", { status: 200 });
});
