// Save as src/lib/payments.ts
// Course payments (student_payments). Payments are entered as pending and become verified only
// through the verify_student_payment database function, which only admins and owners can run.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type PaymentMethod = "bank_transfer" | "cash" | "pos" | "cheque" | "other";
export type PaymentStatus = "pending" | "verified" | "rejected";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash deposit",
  pos: "POS",
  cheque: "Cheque",
  other: "Other",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending verification",
  verified: "Verified",
  rejected: "Rejected",
};

export type PaymentRow = {
  id: string;
  application_id: string;
  full_name: string;
  email: string;
  course: string;
  amount: number;
  currency: "NGN" | "USD";
  payment_reference: string;
  payment_method: PaymentMethod;
  payment_date: string | null;
  verification_status: PaymentStatus;
  rejection_reason: string | null;
  entered_by: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  tuition_amount: number | null;
};

export type PaymentSummary = {
  tuition_amount: number | null;
  verified_total: number;
  pending_total: number;
  outstanding: number | null;
};

export const PAYMENT_PAGE_SIZE = 20;

export function paymentError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === "P0001" && e.message) return e.message;
  if (e?.code === "42501") return "You do not have permission to do that.";
  if (e?.code === "23505") return "A payment with this reference is already recorded for this student.";
  if (e?.code === "23514") return "Please check the amount and reference.";
  return "Something went wrong. Please try again.";
}

export const formatMoney = (n: number, currency: "NGN" | "USD" = "NGN") =>
  new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

export async function fetchPayments(status: string, page: number): Promise<{ rows: PaymentRow[]; total: number }> {
  let q = db.from("payment_queue").select("*", { count: "exact" });
  if (status) q = q.eq("verification_status", status);
  const from = page * PAYMENT_PAGE_SIZE;
  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(from, from + PAYMENT_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: ((data ?? []) as PaymentRow[]).map(normalise), total: count ?? 0 };
}

export async function fetchLeadPayments(applicationId: string): Promise<PaymentRow[]> {
  const { data, error } = await db
    .from("payment_queue")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PaymentRow[]).map(normalise);
}

export async function fetchPaymentSummary(applicationId: string): Promise<PaymentSummary | null> {
  const { data, error } = await db
    .from("lead_payment_summary")
    .select("tuition_amount, verified_total, pending_total, outstanding")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as PaymentSummary;
  return {
    tuition_amount: d.tuition_amount === null ? null : Number(d.tuition_amount),
    verified_total: Number(d.verified_total),
    pending_total: Number(d.pending_total),
    outstanding: d.outstanding === null ? null : Number(d.outstanding),
  };
}

const normalise = (r: PaymentRow): PaymentRow => ({
  ...r,
  amount: Number(r.amount),
  tuition_amount: r.tuition_amount === null ? null : Number(r.tuition_amount),
});

// Records a payment. It is always saved as pending, whatever is sent: the database enforces this.
export async function recordPayment(input: {
  application_id: string;
  amount: number;
  currency: "NGN" | "USD";
  payment_reference: string;
  payment_method: PaymentMethod;
  payment_date: string | null;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw { code: "P0001", message: "Please enter an amount greater than zero." };
  }
  if (input.payment_reference.trim().length < 3) {
    throw { code: "P0001", message: "Please enter the payment reference (at least 3 characters)." };
  }
  const { error } = await db.from("student_payments").insert({
    ...input,
    payment_reference: input.payment_reference.trim(),
  });
  if (error) throw error;
}

export async function verifyPayment(id: string, approve: boolean, reason?: string) {
  const { error } = await db.rpc("verify_student_payment", {
    p_payment_id: id,
    p_approve: approve,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

// Admin only (enforced by the database): the tuition agreed with this student.
export async function setTuition(applicationId: string, amount: number | null) {
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw { code: "P0001", message: "Please enter a valid tuition amount." };
  }
  const { error } = await db.from("lead_pipeline").update({ tuition_amount: amount }).eq("application_id", applicationId);
  if (error) throw error;
}
