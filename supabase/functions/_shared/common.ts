// supabase/functions/_shared/common.ts
// Shared helpers for the Paystack Edge Functions.
// Secrets are read from Supabase secrets (never from the browser or the code):
//   PAYSTACK_SECRET_KEY   your Paystack secret key (sk_test_... while testing)
//   PAYSTACK_MODE         "test" or "live" (default "test")
//   SITE_URL              default https://corepointtech.com.ng
//   ALLOWED_ORIGINS       comma-separated sites allowed to call these functions (supports *.vercel.app)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to Edge Functions automatically.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendQueuedEmails } from "./email.ts";

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://corepointtech.com.ng").replace(/\/$/, "");
const MODE = Deno.env.get("PAYSTACK_MODE") ?? "test";

const allowedOrigins = (
  Deno.env.get("ALLOWED_ORIGINS") ??
  "https://corepointtech.com.ng,https://www.corepointtech.com.ng,http://localhost:3000,http://localhost:5173"
).split(",").map((s) => s.trim());

// An allowed entry is either an exact origin, or "*.example.com" to allow any https subdomain
// (handy for Vercel preview links such as https://my-project-abc123.vercel.app).
function originAllowed(origin: string): boolean {
  return allowedOrigins.some((o) =>
    o === origin || (o.startsWith("*.") && origin.startsWith("https://") && origin.endsWith(o.slice(1)))
  );
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": originAllowed(origin)
      ? origin
      : (allowedOrigins.find((o) => !o.startsWith("*.")) ?? "null"),
    "Access-Control-Allow-Headers":
      req.headers.get("access-control-request-headers") ?? "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function paystack(path: string, init?: RequestInit): Promise<Response> {
  const key = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export type ConfirmResult =
  | "confirmed" | "already_processed" | "needs_review" | "failed" | "abandoned" | "pending"
  | "not_found" | "provider_error";

// Asks Paystack what really happened to this transaction, then hands the answer to the single
// database function that decides. The verify endpoint AND the webhook both use this, so a
// payment is handled the same way no matter which one arrives first.
export async function verifyAndConfirm(db: SupabaseClient, reference: string): Promise<ConfirmResult> {
  let res: Response;
  try {
    res = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  } catch {
    return "provider_error";
  }

  // Paystack answers 404 when the customer never opened the checkout. That means "not paid yet".
  if (res.status === 404) return "pending";
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status || !body?.data) return "provider_error";

  const d = body.data;
  if (d.reference !== reference) return "provider_error";           // never trust a mismatched reply
  if (d.domain && d.domain !== MODE) return "provider_error";       // a test payment can never count in live mode

  // Keep only what we need. Card details in d.authorization are deliberately NOT stored.
  const safe = {
    id: d.id, reference: d.reference, status: d.status, amount: d.amount, currency: d.currency,
    channel: d.channel, paid_at: d.paid_at, created_at: d.created_at, gateway_response: d.gateway_response,
    fees: d.fees, domain: d.domain,
  };

  const { data, error } = await db.rpc("paystack_confirm_charge", {
    p_reference: reference,
    p_tx_id: typeof d.id === "number" ? d.id : null,
    p_status: String(d.status ?? ""),
    p_amount_kobo: typeof d.amount === "number" ? d.amount : null,
    p_currency: String(d.currency ?? ""),
    p_channel: d.channel ?? null,
    p_paid_at: d.paid_at ?? null,
    p_gateway_response: d.gateway_response ?? null,
    p_payload: safe,
  });
  if (error) {
    console.error("paystack_confirm_charge failed", error.code);   // no personal data in logs
    return "provider_error";
  }
  if (data === "confirmed") runInBackground(sendQueuedEmails(db));   // payment confirmation email
  return data as ConfirmResult;
}

// Runs a task after the response has been sent, without making the student wait.
export function runInBackground(task: Promise<unknown>): void {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const safe = task.catch((e) => console.error("background task failed:", e instanceof Error ? e.message : String(e)));
  if (rt?.waitUntil) rt.waitUntil(safe);
}

export { sendQueuedEmails };

export const paidResults: ConfirmResult[] = ["confirmed", "already_processed"];
