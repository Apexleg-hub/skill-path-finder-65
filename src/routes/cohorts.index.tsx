// Save as src/routes/cohorts.index.tsx
// The ".index" suffix lets /cohorts/$slug sit beside it without nesting.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FORMAT_LABEL,
  STATUS_LABEL,
  fetchPublishedCohorts,
  formatDate,
  formatNaira,
  lagosToday,
  type CohortStatus,
  type CohortWithMeta,
} from "@/lib/cohorts";

type CohortSearch = {
  q?: string;
  category?: string;
  status?: string;
  format?: string;
  start?: string;
};

const STATUS_VALUES = ["open", "coming_soon", "closed", "in_progress", "completed"];
const FORMAT_VALUES = ["virtual", "physical", "hybrid"];
const START_VALUES = ["30", "90", "later", "started"];

const clean = (v: unknown, allowed?: string[]) =>
  typeof v === "string" && v.length > 0 && v.length <= 80 && (!allowed || allowed.includes(v)) ? v : undefined;

export const Route = createFileRoute("/cohorts/")({
  validateSearch: (s: Record<string, unknown>): CohortSearch => ({
    q: clean(s.q),
    category: clean(s.category),
    status: clean(s.status, STATUS_VALUES),
    format: clean(s.format, FORMAT_VALUES),
    start: clean(s.start, START_VALUES),
  }),
  head: () => ({
    meta: [
      { title: "Training Cohorts | Corepoint Tech Academy" },
      {
        name: "description",
        content:
          "Join structured, instructor-led cohort training programmes from Corepoint Tech Academy. Build practical skills, complete real projects and advance your career.",
      },
      { property: "og:title", content: "Training Cohorts | Corepoint Tech Academy" },
      {
        property: "og:description",
        content: "Structured, instructor-led programmes with fixed start dates. See available cohorts and register.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://corepointtech.com.ng/cohorts" }],
  }),
  component: CohortsPage,
});

const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};

function matchesStart(c: CohortWithMeta, start: string | undefined, today: string) {
  if (!start) return true;
  if (!c.start_date) return false;
  if (start === "started") return c.start_date <= today;
  if (c.start_date <= today) return false;
  if (start === "30") return c.start_date <= addDays(today, 30);
  if (start === "90") return c.start_date <= addDays(today, 90);
  return c.start_date > addDays(today, 90); // "later"
}

const statusStyles: Record<CohortStatus, string> = {
  open: "bg-primary/10 text-primary",
  coming_soon: "bg-secondary text-secondary-foreground",
  in_progress: "bg-secondary text-secondary-foreground",
  closed: "bg-muted text-muted-foreground",
  completed: "bg-muted text-muted-foreground",
};

function CohortsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [cohorts, setCohorts] = useState<CohortWithMeta[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(search.q ?? "");

  useEffect(() => {
    let active = true;
    fetchPublishedCohorts()
      .then((d) => active && setCohorts(d))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  // Keep the search box responsive; write to the URL after a short pause.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== query.trim()) {
        navigate({ search: (prev) => ({ ...prev, q: query.trim() || undefined }), replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, search.q, navigate]);

  const setFilter = (key: keyof CohortSearch, value: string) =>
    navigate({ search: (prev) => ({ ...prev, [key]: value || undefined }), replace: true });

  const clearAll = () => {
    setQuery("");
    navigate({ search: {}, replace: true });
  };

  const categories = useMemo(
    () => Array.from(new Set((cohorts ?? []).map((c) => c.category).filter(Boolean) as string[])).sort(),
    [cohorts],
  );

  const filtered = useMemo(() => {
    const today = lagosToday();
    const q = (search.q ?? "").toLowerCase();
    return (cohorts ?? []).filter(
      (c) =>
        (!q || `${c.programme_name} ${c.title}`.toLowerCase().includes(q)) &&
        (!search.category || c.category === search.category) &&
        (!search.status || c.status === search.status) &&
        (!search.format || c.learning_format === search.format) &&
        matchesStart(c, search.start, today),
    );
  }, [cohorts, search]);

  const hasFilters = Boolean(search.q || search.category || search.status || search.format || search.start);

  const selectClass =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Learn In-Demand Skills with Corepoint Tech Academy Cohorts
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/80">
            Join our structured, instructor-led training programmes designed to help you develop practical skills,
            build real-world projects, and advance your career.
          </p>
          <Button asChild variant="cta" size="xl" className="mt-8">
            <a href="#available-cohorts">Explore Available Cohorts</a>
          </Button>
        </div>
      </section>

      <section id="available-cohorts" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">Available Cohorts</h2>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cohorts by name"
              aria-label="Search cohorts by name"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Course category</span>
              <select
                className={selectClass}
                value={search.category ?? ""}
                onChange={(e) => setFilter("category", e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Registration status</span>
              <select
                className={selectClass}
                value={search.status ?? ""}
                onChange={(e) => setFilter("status", e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s as CohortStatus]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Learning format</span>
              <select
                className={selectClass}
                value={search.format ?? ""}
                onChange={(e) => setFilter("format", e.target.value)}
              >
                <option value="">Any format</option>
                <option value="virtual">Virtual</option>
                <option value="physical">Physical</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Start date</span>
              <select
                className={selectClass}
                value={search.start ?? ""}
                onChange={(e) => setFilter("start", e.target.value)}
              >
                <option value="">Any time</option>
                <option value="30">Starts within 30 days</option>
                <option value="90">Starts within 90 days</option>
                <option value="later">Starts later than 90 days</option>
                <option value="started">Already started</option>
              </select>
            </label>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <X className="size-4" /> Clear filters
            </button>
          )}
        </div>

        <div className="mt-8" aria-live="polite">
          {cohorts === null && !failed && <LoadingGrid />}

          {failed && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <h3 className="text-lg font-semibold">We could not load cohorts right now</h3>
              <p className="mt-2 text-sm text-muted-foreground">Please refresh the page or try again shortly.</p>
              <Button className="mt-5" variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          )}

          {cohorts !== null && !failed && cohorts.length === 0 && (
            <EmptyState
              title="New cohorts are being prepared"
              body="No cohorts are published yet. Browse our standard courses in the meantime, or register your interest and our admissions team will contact you."
              showClear={false}
              onClear={clearAll}
            />
          )}

          {cohorts !== null && cohorts.length > 0 && filtered.length === 0 && (
            <EmptyState
              title="No cohorts match your filters"
              body="Try removing a filter or searching with a different name."
              showClear
              onClear={clearAll}
            />
          )}

          {filtered.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing {filtered.length} {filtered.length === 1 ? "cohort" : "cohorts"}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <CohortCard key={c.id} cohort={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CohortCard({ cohort: c }: { cohort: CohortWithMeta }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {c.image_url ? (
        <img
          src={c.image_url}
          alt={`${c.programme_name} training`}
          loading="lazy"
          width={1024}
          height={640}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-hero-gradient" aria-hidden="true" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[c.status]}`}>
            {STATUS_LABEL[c.status]}
          </span>
          {c.cohort_number != null && (
            <span className="text-xs font-medium text-muted-foreground">Cohort {c.cohort_number}</span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold">{c.programme_name}</h3>
        {c.description && <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}

        <dl className="mt-4 space-y-2 text-sm">
          <Row icon={<Clock className="size-4" />} label="Duration">
            {c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}
          </Row>
          <Row icon={<CalendarDays className="size-4" />} label="Starts">
            {formatDate(c.start_date)}
          </Row>
          <Row icon={<MapPin className="size-4" />} label="Format">
            {FORMAT_LABEL[c.learning_format]}
          </Row>
          {c.seatsRemaining !== null && (
            <Row icon={<Users className="size-4" />} label="Seats left">
              {c.seatsRemaining}
            </Row>
          )}
          <Row icon={<CalendarDays className="size-4" />} label="Register by">
            {formatDate(c.registration_deadline)}
          </Row>
        </dl>

        <p className="mt-4 text-lg font-bold">{formatNaira(c.tuition_fee)}</p>

        <Button asChild variant="cta" className="mt-4">
          <Link to="/cohorts/$slug" params={{ slug: c.slug }}>
            View Details
          </Link>
        </Button>
      </div>
    </article>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </div>
  );
}

function EmptyState({
  title,
  body,
  showClear,
  onClear,
}: {
  title: string;
  body: string;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <CalendarDays className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {showClear && <Button onClick={onClear}>Clear filters</Button>}
        <Button asChild variant="outline">
          <Link to="/courses">Browse Courses</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/register">Register Interest</Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading cohorts">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-40 bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
