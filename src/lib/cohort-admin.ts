// Save as src/lib/cohort-admin.ts
// Data access for cohort management. Everything runs with the signed-in admin's session and is
// enforced by Row Level Security and database functions, not by this code.
import { supabase } from "@/integrations/supabase/client";
import { lagosToday } from "@/lib/cohorts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AdminCohort = {
  id: string;
  programme_name: string;
  slug: string;
  cohort_number: number;
  title: string;
  description: string | null;
  about: string | null;
  image_url: string | null;
  category: string | null;
  skills: string[];
  duration_weeks: number | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  learning_format: "virtual" | "physical" | "hybrid";
  class_schedule: string | null;
  tuition_fee: number | null;
  early_bird_fee: number | null;
  early_bird_deadline: string | null;
  seat_capacity: number | null;
  payment_options: string[];
  faqs: { q: string; a: string }[];
  publication_status: "draft" | "published" | "unpublished";
  cohort_status: "coming_soon" | "open" | "closed";
};

export type CohortSummary = { registrations: number; paid: number; verified_revenue: number };
export type CohortListItem = AdminCohort & { summary: CohortSummary };

export type ModuleDraft = {
  week_number: string;
  module_title: string;
  module_description: string;
  topics: string; // one per line
  objectives: string; // one per line
  assignment: string;
};

export type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  experience_level: string;
  learning_goal: string | null;
  payment_option: string | null;
  registration_reference: string;
  amount_due: number;
  early_bird_applied: boolean;
  registration_status: "registered" | "enrolled" | "cancelled";
  payment_status: "pending" | "submitted" | "partially_paid" | "paid" | "rejected";
  registered_at: string;
};

export type CohortPaymentRow = {
  id: string;
  amount: number;
  payment_reference: string;
  payment_date: string | null;
  verification_status: "submitted" | "verified" | "rejected";
  verified_at: string | null;
  created_at: string;
};

export function cohortError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === "P0001" && e.message) return e.message;
  if (e?.code === "42501") return "You do not have permission to do that.";
  if (e?.code === "23505") return "That web address or cohort number is already used for this programme.";
  if (e?.code === "23514")
    return "Please check the details. A cohort needs a start date, tuition fee and registration deadline to be published, and end dates and early-bird fees must make sense.";
  return "Something went wrong. Please try again.";
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export async function fetchAdminCohorts(): Promise<CohortListItem[]> {
  const [cohorts, summary] = await Promise.all([
    db.from("cohorts").select("*").order("created_at", { ascending: false }),
    db.from("cohort_admin_summary").select("*"),
  ]);
  if (cohorts.error) throw cohorts.error;
  if (summary.error) throw summary.error;
  const byId = new Map<string, CohortSummary>(
    ((summary.data ?? []) as { cohort_id: string; registrations: number; paid: number; verified_revenue: number }[]).map(
      (s) => [s.cohort_id, { registrations: Number(s.registrations), paid: Number(s.paid), verified_revenue: Number(s.verified_revenue) }],
    ),
  );
  return ((cohorts.data ?? []) as AdminCohort[]).map((c) => ({
    ...c,
    skills: c.skills ?? [],
    payment_options: c.payment_options ?? [],
    faqs: Array.isArray(c.faqs) ? c.faqs : [],
    summary: byId.get(c.id) ?? { registrations: 0, paid: 0, verified_revenue: 0 },
  }));
}

export async function fetchCohortForEdit(id: string): Promise<{ cohort: AdminCohort; modules: ModuleDraft[] }> {
  const [c, m] = await Promise.all([
    db.from("cohorts").select("*").eq("id", id).single(),
    db.from("cohort_curriculum").select("*").eq("cohort_id", id)
      .order("display_order", { ascending: true }).order("week_number", { ascending: true }),
  ]);
  if (c.error) throw c.error;
  if (m.error) throw m.error;
  const cohort = c.data as AdminCohort;
  return {
    cohort: {
      ...cohort,
      skills: cohort.skills ?? [],
      payment_options: cohort.payment_options ?? [],
      faqs: Array.isArray(cohort.faqs) ? cohort.faqs : [],
    },
    modules: ((m.data ?? []) as {
      week_number: number; module_title: string; module_description: string | null;
      topics: string[] | null; objectives: string[] | null; assignment: string | null;
    }[]).map((x) => ({
      week_number: String(x.week_number),
      module_title: x.module_title,
      module_description: x.module_description ?? "",
      topics: (x.topics ?? []).join("\n"),
      objectives: (x.objectives ?? []).join("\n"),
      assignment: x.assignment ?? "",
    })),
  };
}

export type CohortInput = Omit<AdminCohort, "id" | "publication_status" | "cohort_status"> &
  Partial<Pick<AdminCohort, "publication_status" | "cohort_status">>;

// Creates or updates a cohort and returns its id. New cohorts always start as unpublished drafts.
export async function saveCohort(input: CohortInput, id?: string): Promise<string> {
  if (id) {
    const { error } = await db.from("cohorts").update(input).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await db
    .from("cohorts")
    .insert({ ...input, publication_status: "draft", cohort_status: "coming_soon" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function saveCurriculum(cohortId: string, modules: ModuleDraft[]) {
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const payload = modules.map((m, i) => ({
    week_number: Number(m.week_number) > 0 ? Number(m.week_number) : i + 1,
    module_title: m.module_title,
    module_description: m.module_description,
    topics: lines(m.topics),
    objectives: lines(m.objectives),
    assignment: m.assignment,
  }));
  const { error } = await db.rpc("save_cohort_curriculum", { p_cohort_id: cohortId, p_modules: payload });
  if (error) throw error;
}

export async function setPublication(id: string, status: "published" | "unpublished") {
  const { error } = await db.from("cohorts").update({ publication_status: status }).eq("id", id);
  if (error) throw error;
}

export async function setRegistrationOpen(id: string, open: boolean) {
  const { error } = await db.from("cohorts").update({ cohort_status: open ? "open" : "closed" }).eq("id", id);
  if (error) throw error;
}

export async function uploadCohortImage(file: File): Promise<string> {
  const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext = types[file.type];
  if (!ext) throw { code: "P0001", message: "Please choose a JPG, PNG or WebP image." };
  if (file.size > 2 * 1024 * 1024) throw { code: "P0001", message: "The image must be 2 MB or smaller." };
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("cohort-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from("cohort-images").getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------
export const REG_PAGE_SIZE = 20;

export type RegFilters = { q: string; registration: string; payment: string; page: number };

const cleanSearch = (q: string) => q.replace(/[%,()*\\:]/g, " ").trim().slice(0, 80);

export async function fetchRegistrations(
  cohortId: string,
  f: RegFilters,
): Promise<{ rows: RegistrationRow[]; total: number }> {
  let query = db.from("cohort_registrations").select("*", { count: "exact" }).eq("cohort_id", cohortId);
  const q = cleanSearch(f.q);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,registration_reference.ilike.%${q}%`);
  if (f.registration) query = query.eq("registration_status", f.registration);
  if (f.payment) query = query.eq("payment_status", f.payment);
  const from = f.page * REG_PAGE_SIZE;
  const { data, error, count } = await query
    .order("registered_at", { ascending: false })
    .range(from, from + REG_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as RegistrationRow[], total: count ?? 0 };
}

export async function fetchRegistrationPayments(registrationId: string): Promise<CohortPaymentRow[]> {
  const { data, error } = await db
    .from("cohort_payments")
    .select("id, amount, payment_reference, payment_date, verification_status, verified_at, created_at")
    .eq("registration_id", registrationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CohortPaymentRow[];
}

export async function setRegistrationCancelled(id: string, cancelled: boolean) {
  const { error } = await db
    .from("cohort_registrations")
    .update({ registration_status: cancelled ? "cancelled" : "registered" })
    .eq("id", id);
  if (error) throw error;
}

export async function verifyCohortPayment(paymentId: string, approve: boolean) {
  const { error } = await db.rpc("verify_cohort_payment", { p_payment_id: paymentId, p_approve: approve });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
// Cells that start with = + - @ can run as formulas when opened in Excel, so they are neutralised.
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function exportRegistrationsCsv(cohortId: string, slug: string): Promise<number> {
  const all: RegistrationRow[] = [];
  const CHUNK = 1000;
  for (let from = 0; from < 10000; from += CHUNK) {
    const { data, error } = await db
      .from("cohort_registrations")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("registered_at", { ascending: true })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    const rows = (data ?? []) as RegistrationRow[];
    all.push(...rows);
    if (rows.length < CHUNK) break;
  }

  const header = [
    "Reference", "Full name", "Email", "WhatsApp phone", "Experience level", "Reason for joining",
    "Payment option", "Amount due (NGN)", "Early-bird applied", "Registration status", "Payment status", "Registered at",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of all) {
    lines.push(
      [
        r.registration_reference, r.full_name, r.email, r.phone, r.experience_level, r.learning_goal,
        r.payment_option, r.amount_due, r.early_bird_applied ? "Yes" : "No",
        r.registration_status, r.payment_status, r.registered_at,
      ].map(csvCell).join(","),
    );
  }

  // Record the export first: if it cannot be logged, nothing is downloaded.
  const { error: logError } = await db.rpc("log_data_export", {
    p_table: "cohort_registrations",
    p_row_count: all.length,
  });
  if (logError) throw logError;

  // The leading BOM lets Excel read names with accents correctly.
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-registrations-${lagosToday()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return all.length;
}
