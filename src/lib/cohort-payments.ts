// Save as src/lib/cohort-payments.ts
// Data access for the Cohort Payments admin page. Everything runs with the signed-in admin's
// session and is enforced by the database, not by this code.
import { supabase } from "@/integrations/supabase/client";
import { csvCell } from "@/lib/cohort-admin";
import { lagosToday } from "@/lib/cohorts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ReportRow = {
  registration_id: string;
  registration_reference: string;
  full_name: string;
  email: string;
  phone: string;
  cohort_id: string;
  cohort_title: string;
  programme_name: string;
  amount_due: number;
  payment_status: "pending" | "submitted" | "partially_paid" | "paid" | "rejected";
  registration_status: "registered" | "enrolled" | "cancelled";
  registered_at: string;
  paid_amount: number | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  attempts: number;
  last_attempt_status: string | null;
  last_attempt_at: string | null;
  needs_review: boolean;
};

export type ReviewRow = {
  id: string;
  reference: string;
  expected_kobo: number;
  received_kobo: number | null;
  review_reason: string | null;
  channel: string | null;
  created_at: string;
  registration_id: string;
  registration_reference: string;
  full_name: string;
  email: string;
  amount_due: number;
  registration_status: string;
  payment_status: string;
  cohort_title: string;
};

export type AttemptRow = {
  id: string;
  reference: string;
  status: string;
  amount_kobo: number;
  channel: string | null;
  gateway_response: string | null;
  created_at: string;
  paid_at: string | null;
  review_reason: string | null;
};

export type Metrics = {
  total_registrations: number;
  confirmed_students: number;
  pending_payments: number;
  successful_payments: number;
  failed_payments: number;
  held_for_review: number;
  verified_revenue: number;
};

export type CohortOption = { id: string; title: string; programme_name: string };

export type ReportFilters = {
  q: string;
  programme: string;
  cohort: string;
  payment: string;        // "" | pending | submitted | partially_paid | paid | rejected | unpaid
  registeredFrom: string;
  registeredTo: string;
  paidFrom: string;
  paidTo: string;
  page: number;
};

export const EMPTY_FILTERS: ReportFilters = {
  q: "", programme: "", cohort: "", payment: "", registeredFrom: "", registeredTo: "", paidFrom: "", paidTo: "", page: 0,
};

export const REPORT_PAGE_SIZE = 20;

export function reportError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === "P0001" && e.message) return e.message;
  if (e?.code === "42501") return "You do not have permission to do that.";
  return "Something went wrong. Please try again.";
}

const cleanSearch = (q: string) => q.replace(/[%,()*\\:]/g, " ").trim().slice(0, 80);

// Applies the page filters to a query on cohort_payment_report.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, f: ReportFilters) {
  const q = cleanSearch(f.q);
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,registration_reference.ilike.%${q}%,payment_reference.ilike.%${q}%`,
    );
  }
  if (f.programme) query = query.eq("programme_name", f.programme);
  if (f.cohort) query = query.eq("cohort_id", f.cohort);
  if (f.payment === "unpaid") query = query.neq("payment_status", "paid").neq("registration_status", "cancelled");
  else if (f.payment) query = query.eq("payment_status", f.payment);
  if (f.registeredFrom) query = query.gte("registered_at", `${f.registeredFrom}T00:00:00+01:00`); // Lagos time
  if (f.registeredTo) query = query.lte("registered_at", `${f.registeredTo}T23:59:59+01:00`);
  if (f.paidFrom) query = query.gte("paid_at", `${f.paidFrom}T00:00:00+01:00`);
  if (f.paidTo) query = query.lte("paid_at", `${f.paidTo}T23:59:59+01:00`);
  return query;
}

export async function fetchReport(f: ReportFilters): Promise<{ rows: ReportRow[]; total: number }> {
  const from = f.page * REPORT_PAGE_SIZE;
  const { data, error, count } = await applyFilters(db.from("cohort_payment_report").select("*", { count: "exact" }), f)
    .order("registered_at", { ascending: false })
    .range(from, from + REPORT_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: ((data ?? []) as ReportRow[]).map(norm), total: count ?? 0 };
}

const norm = (r: ReportRow): ReportRow => ({
  ...r,
  amount_due: Number(r.amount_due),
  paid_amount: r.paid_amount === null ? null : Number(r.paid_amount),
  attempts: Number(r.attempts),
});

export async function fetchMetrics(cohortId: string): Promise<Metrics> {
  const { data, error } = await db.rpc("cohort_payment_metrics", { p_cohort_id: cohortId || null });
  if (error) throw error;
  const m = (Array.isArray(data) ? data[0] : data) as Metrics;
  return {
    total_registrations: Number(m.total_registrations),
    confirmed_students: Number(m.confirmed_students),
    pending_payments: Number(m.pending_payments),
    successful_payments: Number(m.successful_payments),
    failed_payments: Number(m.failed_payments),
    held_for_review: Number(m.held_for_review),
    verified_revenue: Number(m.verified_revenue),
  };
}

export async function fetchCohortOptions(): Promise<CohortOption[]> {
  const { data, error } = await db.from("cohorts").select("id, title, programme_name").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CohortOption[];
}

export async function fetchRevenueByCohort(): Promise<{ cohort_id: string; verified_revenue: number; paid: number; registrations: number }[]> {
  const { data, error } = await db.from("cohort_admin_summary").select("*");
  if (error) throw error;
  return ((data ?? []) as { cohort_id: string; verified_revenue: number; paid: number; registrations: number }[]).map((r) => ({
    cohort_id: r.cohort_id,
    verified_revenue: Number(r.verified_revenue),
    paid: Number(r.paid),
    registrations: Number(r.registrations),
  }));
}

export async function fetchAttempts(registrationId: string): Promise<AttemptRow[]> {
  const { data, error } = await db
    .from("paystack_payments")
    .select("id, reference, status, amount_kobo, channel, gateway_response, created_at, paid_at, review_reason")
    .eq("registration_id", registrationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttemptRow[];
}

export async function fetchReviewQueue(): Promise<ReviewRow[]> {
  const { data, error } = await db.from("paystack_review_queue").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReviewRow[];
}

export async function resolveReview(paymentId: string, approve: boolean, note: string) {
  const { error } = await db.rpc("paystack_resolve_review", { p_payment_id: paymentId, p_approve: approve, p_note: note });
  if (error) throw error;
}

// Exports every row that matches the current filters (up to 10,000) to CSV. The export is logged first.
export async function exportReportCsv(f: ReportFilters): Promise<number> {
  const all: ReportRow[] = [];
  const CHUNK = 1000;
  for (let from = 0; from < 10000; from += CHUNK) {
    const { data, error } = await applyFilters(db.from("cohort_payment_report").select("*"), f)
      .order("registered_at", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    const rows = ((data ?? []) as ReportRow[]).map(norm);
    all.push(...rows);
    if (rows.length < CHUNK) break;
  }

  const { error: logError } = await db.rpc("log_data_export", { p_table: "cohort_registrations", p_row_count: all.length });
  if (logError) throw logError;

  const header = [
    "Student name", "Email", "Phone", "Programme", "Cohort", "Tuition (NGN)", "Amount paid (NGN)",
    "Payment status", "Payment method", "Transaction reference", "Payment date", "Enrolment status",
    "Registration reference", "Registered at", "Payment attempts",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of all) {
    lines.push(
      [
        r.full_name, r.email, r.phone, r.programme_name, r.cohort_title, r.amount_due, r.paid_amount ?? "",
        r.payment_status, r.payment_method ?? "", r.payment_reference ?? "", r.paid_at ?? "",
        r.registration_status === "enrolled" ? "Confirmed" : r.registration_status === "cancelled" ? "Cancelled" : "Not confirmed",
        r.registration_reference, r.registered_at, r.attempts,
      ].map(csvCell).join(","),
    );
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cohort-payments-${lagosToday()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return all.length;
}
