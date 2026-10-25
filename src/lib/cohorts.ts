// Save as src/lib/cohorts.ts
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";

export type Cohort = {
  id: string;
  slug: string;
  programme_name: string;
  cohort_number: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  duration_weeks: number | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  registration_deadline: string | null;
  learning_format: "virtual" | "physical" | "hybrid";
  tuition_fee: number | null;
  seat_capacity: number | null;
  cohort_status: "coming_soon" | "open" | "closed" | null;
};

export type CohortStatus = "open" | "coming_soon" | "closed" | "in_progress" | "completed";

export type CohortWithMeta = Cohort & {
  status: CohortStatus;
  seatsRemaining: number | null; // null means no capacity limit configured
};

export const STATUS_LABEL: Record<CohortStatus, string> = {
  open: "Registration Open",
  coming_soon: "Coming Soon",
  closed: "Registration Closed",
  in_progress: "In Progress",
  completed: "Completed",
};

export const FORMAT_LABEL: Record<Cohort["learning_format"], string> = {
  virtual: "Virtual",
  physical: "Physical",
  hybrid: "Hybrid",
};

// Sort priority: open first, then upcoming, then the rest.
const STATUS_ORDER: Record<CohortStatus, number> = {
  open: 0,
  coming_soon: 1,
  in_progress: 2,
  closed: 3,
  completed: 4,
};

// Today's date in Lagos as YYYY-MM-DD, matching the database rules.
export function lagosToday(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

// Status comes from stored dates, flags and seat counts, not from typed text.
// The database re-checks all of this when someone registers.
export function deriveStatus(
  c: Pick<Cohort, "start_date" | "end_date" | "registration_deadline" | "cohort_status">,
  seatsRemaining: number | null = null,
  now = new Date(),
): CohortStatus {
  const today = lagosToday(now);
  if (c.end_date && c.end_date < today) return "completed";
  if (c.start_date && c.start_date <= today) return "in_progress";
  if (c.cohort_status === "coming_soon") return "coming_soon";
  if (c.cohort_status === "closed") return "closed";
  if (c.registration_deadline && c.registration_deadline < today) return "closed";
  if (seatsRemaining !== null && seatsRemaining <= 0) return "closed";
  return "open";
}

export function sortCohorts<T extends { status: CohortStatus; start_date: string | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    // Upcoming: soonest first. Past: most recent first.
    const da = a.start_date ?? "9999-12-31";
    const db = b.start_date ?? "9999-12-31";
    return a.status === "completed" || a.status === "in_progress" ? db.localeCompare(da) : da.localeCompare(db);
  });
}

export const formatDate = (d: string | null) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "To be confirmed";

export const formatNaira = (n: number | null) =>
  n == null
    ? "To be confirmed"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const COLUMNS =
  "id, slug, programme_name, cohort_number, title, description, image_url, category, duration_weeks, start_date, end_date, registration_deadline, learning_format, tuition_fee, seat_capacity, cohort_status";

// Published cohorts only. Row Level Security enforces this; the filter is a second safeguard.
export async function fetchPublishedCohorts(): Promise<CohortWithMeta[]> {
  const { data, error } = await supabase
    .from("cohorts" as never)
    .select(COLUMNS)
    .eq("publication_status", "published");
  if (error || !data) throw error ?? new Error("Could not load cohorts");

  const rows = data as unknown as Cohort[];

  // Seat counts come from a database function that exposes numbers only, never student data.
  const withSeats = await Promise.all(
    rows.map(async (c) => {
      let seatsRemaining: number | null = null;
      if (c.seat_capacity != null) {
        const { data: seats } = await supabase.rpc(
          "cohort_seats_remaining" as never,
          { p_cohort_id: c.id } as never,
        );
        seatsRemaining = typeof seats === "number" ? seats : null;
      }
      return { ...c, seatsRemaining, status: deriveStatus(c, seatsRemaining) };
    }),
  );

  return sortCohorts(withSeats);
}

// ---------------------------------------------------------------------------
// Detail page data
// ---------------------------------------------------------------------------
export type CurriculumModule = {
  id: string;
  week_number: number;
  module_title: string;
  module_description: string | null;
  topics: string[];
  objectives: string[];
  assignment: string | null;
  display_order: number;
};

export type CohortFaq = { q: string; a: string };

export type CohortDetail = CohortWithMeta & {
  about: string | null;
  skills: string[];
  class_schedule: string | null;
  early_bird_fee: number | null;
  early_bird_deadline: string | null;
  payment_options: string[];
  faqs: CohortFaq[];
  earlyBirdActive: boolean;
};

export type CohortDetailResult = { cohort: CohortDetail; curriculum: CurriculumModule[] };

// Returns null when the slug does not exist or is not published (Row Level Security hides it).
export async function fetchCohortDetail(slug: string): Promise<CohortDetailResult | null> {
  const { data, error } = await supabase
    .from("cohorts" as never)
    .select("*")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Cohort & {
    about: string | null;
    skills: string[] | null;
    class_schedule: string | null;
    early_bird_fee: number | null;
    early_bird_deadline: string | null;
    payment_options: string[] | null;
    faqs: unknown;
  };

  let seatsRemaining: number | null = null;
  if (row.seat_capacity != null) {
    const { data: seats } = await supabase.rpc("cohort_seats_remaining" as never, { p_cohort_id: row.id } as never);
    seatsRemaining = typeof seats === "number" ? seats : null;
  }

  const { data: mods } = await supabase
    .from("cohort_curriculum" as never)
    .select("id, week_number, module_title, module_description, topics, objectives, assignment, display_order")
    .eq("cohort_id", row.id)
    .order("display_order", { ascending: true })
    .order("week_number", { ascending: true });

  const faqs = Array.isArray(row.faqs)
    ? (row.faqs as CohortFaq[]).filter((f) => f && typeof f.q === "string" && typeof f.a === "string")
    : [];

  const today = lagosToday();
  const earlyBirdActive =
    row.early_bird_fee != null && row.early_bird_deadline != null && row.early_bird_deadline >= today;

  return {
    cohort: {
      ...row,
      skills: row.skills ?? [],
      payment_options: row.payment_options ?? [],
      faqs,
      seatsRemaining,
      status: deriveStatus(row, seatsRemaining),
      earlyBirdActive,
    },
    curriculum: ((mods ?? []) as unknown as CurriculumModule[]).map((m) => ({
      ...m,
      topics: m.topics ?? [],
      objectives: m.objectives ?? [],
    })),
  };
}
