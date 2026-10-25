// Save as src/lib/leads.ts
// Data access for the CRM. Every call goes through Row Level Security with the signed-in user's
// session: staff and above can read and work leads, nobody else gets rows back.
// The client is loosely typed here because your generated Supabase types do not know the new
// tables yet. After running `supabase gen types` you can tighten this.
import { supabase } from "@/integrations/supabase/client";
import { lagosToday } from "@/lib/cohorts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type LeadStatus = "unknown" | "new" | "contacted" | "enrolled" | "not_interested";
export type Consent = "unknown" | "granted" | "declined";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  unknown: "Unreviewed",
  new: "New",
  contacted: "Contacted",
  enrolled: "Enrolled",
  not_interested: "Not interested",
};

export type LeadRow = {
  application_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  course: string;
  learning_format: string | null;
  experience_level: string | null;
  occupation: string | null;
  source: string | null;
  message: string | null;
  applied_at: string;
  status: LeadStatus;
  follow_up_date: string | null;
  contacted_at: string | null;
  assigned_to: string | null;
  marketing_consent: Consent;
  last_contact_at: string | null;
  communication_count: number;
  note_count: number;
};

export type LeadNote = { id: string; author_id: string; body: string; created_at: string };

export type Channel = "email" | "whatsapp" | "phone" | "sms" | "in_person";
export type MessageType = "welcome" | "follow_up" | "payment_reminder" | "general" | "marketing";
export type DeliveryStatus = "logged" | "queued" | "sent" | "delivered" | "read" | "replied" | "failed";

export type CommLog = {
  id: string;
  channel: Channel;
  message_type: MessageType;
  direction: "outbound" | "inbound";
  delivery_status: DeliveryStatus;
  summary: string | null;
  contacted_at: string;
  staff_id: string;
};

export const PAGE_SIZE = 20;

export type LeadFilters = {
  q: string;
  course: string;
  status: string;
  followUp: string; // "" | due | upcoming | none
  from: string; // YYYY-MM-DD
  to: string;
  page: number; // 0-based
};

// Messages a person can act on. Database rule messages (P0001) are written for people.
export function leadError(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code === "P0001" && e.message) return e.message;
  if (e?.code === "42501") return "You do not have permission to do that.";
  return "Something went wrong. Please try again.";
}

// Search text is placed inside a PostgREST filter, so strip characters that have meaning there.
const cleanSearch = (q: string) => q.replace(/[%,()*\\:]/g, " ").trim().slice(0, 80);

export async function fetchLeads(f: LeadFilters): Promise<{ rows: LeadRow[]; total: number }> {
  let query = db.from("lead_overview").select("*", { count: "exact" });

  const q = cleanSearch(f.q);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (f.course) query = query.eq("course", f.course);
  if (f.status) query = query.eq("status", f.status);
  if (f.from) query = query.gte("applied_at", `${f.from}T00:00:00+01:00`); // Lagos time
  if (f.to) query = query.lte("applied_at", `${f.to}T23:59:59+01:00`);

  const today = lagosToday();
  if (f.followUp === "due") query = query.not("follow_up_date", "is", null).lte("follow_up_date", today);
  if (f.followUp === "upcoming") query = query.gt("follow_up_date", today);
  if (f.followUp === "none") query = query.is("follow_up_date", null);

  const from = f.page * PAGE_SIZE;
  const { data, error, count } = await query
    .order("applied_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as LeadRow[], total: count ?? 0 };
}

export async function fetchLeadById(id: string): Promise<LeadRow | null> {
  const { data, error } = await db.from("lead_overview").select("*").eq("application_id", id).maybeSingle();
  if (error) throw error;
  return (data as LeadRow) ?? null;
}

export async function fetchCourses(): Promise<string[]> {
  const { data, error } = await db.from("lead_overview").select("course").limit(1000);
  if (error) throw error;
  return Array.from(new Set(((data ?? []) as { course: string }[]).map((r) => r.course))).sort();
}

export async function fetchLeadHistory(id: string): Promise<{ notes: LeadNote[]; logs: CommLog[] }> {
  const [notes, logs] = await Promise.all([
    db.from("lead_notes").select("id, author_id, body, created_at").eq("application_id", id)
      .order("created_at", { ascending: false }),
    db.from("communication_logs")
      .select("id, channel, message_type, direction, delivery_status, summary, contacted_at, staff_id")
      .eq("application_id", id).order("contacted_at", { ascending: false }),
  ]);
  if (notes.error) throw notes.error;
  if (logs.error) throw logs.error;
  return { notes: (notes.data ?? []) as LeadNote[], logs: (logs.data ?? []) as CommLog[] };
}

export async function updateLead(
  id: string,
  patch: Partial<{ status: LeadStatus; follow_up_date: string | null }>,
) {
  const { error } = await db.from("lead_pipeline").update(patch).eq("application_id", id);
  if (error) throw error;
}

export async function addNote(id: string, body: string) {
  const text = body.trim();
  if (!text || text.length > 2000) throw { code: "P0001", message: "A note must be between 1 and 2000 characters." };
  const { error } = await db.from("lead_notes").insert({ application_id: id, body: text });
  if (error) throw error;
}

export async function addCommunication(input: {
  application_id: string;
  channel: Channel;
  message_type: MessageType;
  direction: "outbound" | "inbound";
  delivery_status: DeliveryStatus;
  summary: string;
  contacted_at: string; // ISO
}) {
  const summary = input.summary.trim();
  if (summary.length > 1000) throw { code: "P0001", message: "The summary must be 1000 characters or fewer." };
  const { error } = await db.from("communication_logs").insert({ ...input, summary: summary || null });
  if (error) throw error;
}

export async function recordOptOut(id: string) {
  const { error } = await db.rpc("record_opt_out", { p_application_id: id });
  if (error) throw error;
}

export type LeadStats = { total: number; unreviewed: number; contacted: number; followUpsDue: number; enrolled: number };

export async function fetchLeadStats(): Promise<LeadStats> {
  const count = async (build: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { count: c, error } = await build(db.from("lead_pipeline").select("id", { count: "exact", head: true }));
    if (error) throw error;
    return (c ?? 0) as number;
  };
  const today = lagosToday();
  const [total, unreviewed, contacted, followUpsDue, enrolled] = await Promise.all([
    count((q) => q),
    count((q) => q.in("status", ["new", "unknown"])),
    count((q) => q.eq("status", "contacted")),
    count((q) => q.in("status", ["new", "unknown", "contacted"]).not("follow_up_date", "is", null).lte("follow_up_date", today)),
    count((q) => q.eq("status", "enrolled")),
  ]);
  return { total, unreviewed, contacted, followUpsDue, enrolled };
}

// A WhatsApp chat link for staff to open by hand. Nothing is sent automatically.
export function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1); // Nigerian local format
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}
