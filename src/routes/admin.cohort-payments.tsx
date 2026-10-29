// Save as src/routes/admin.cohort-payments.tsx
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Loader2, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { atLeast, useAdmin } from "@/lib/admin-access";
import { formatDate, formatNaira } from "@/lib/cohorts";
import { whatsappLink } from "@/lib/leads";
import {
  EMPTY_FILTERS,
  REPORT_PAGE_SIZE,
  exportReportCsv,
  fetchAttempts,
  fetchCohortOptions,
  fetchMetrics,
  fetchReport,
  fetchReviewQueue,
  fetchRevenueByCohort,
  reportError,
  resolveReview,
  type AttemptRow,
  type CohortOption,
  type Metrics,
  type ReportFilters,
  type ReportRow,
  type ReviewRow,
} from "@/lib/cohort-payments";

export const Route = createFileRoute("/admin/cohort-payments")({
  component: CohortPaymentsPage,
});

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted for verification",
  partially_paid: "Partially paid",
  paid: "Paid",
  rejected: "Rejected",
};

const badge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  submitted: "bg-primary/10 text-primary",
  partially_paid: "bg-secondary text-secondary-foreground",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const ATTEMPT_LABEL: Record<string, string> = {
  initialized: "Started",
  pending: "Processing",
  success: "Successful",
  failed: "Failed",
  abandoned: "Cancelled",
  needs_review: "Held for review",
};

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "None";

function CohortPaymentsPage() {
  const admin = useAdmin();
  const allowed = atLeast(admin.role, "admin");
  const isOwner = admin.role === "owner";

  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [revenue, setRevenue] = useState<Map<string, { verified_revenue: number; paid: number; registrations: number }>>(new Map());
  const [review, setReview] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    fetchCohortOptions().then(setCohorts).catch(() => setCohorts([]));
  }, [allowed]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === searchText ? f : { ...f, q: searchText, page: 0 })), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Summary numbers, per-cohort revenue and the review queue.
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    fetchMetrics(filters.cohort).then((m) => active && setMetrics(m)).catch((e) => active && setError(reportError(e)));
    fetchRevenueByCohort()
      .then((list) => active && setRevenue(new Map(list.map((r) => [r.cohort_id, r]))))
      .catch(() => undefined);
    fetchReviewQueue().then((r) => active && setReview(r)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [allowed, filters.cohort, reload]);

  // The payment list.
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchReport(filters)
      .then((r) => {
        if (!active) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => active && setError(reportError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [allowed, filters, reload]);

  if (!allowed) {
    return (
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Cohort Payments</h1>
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Cohort payments are available to admins and owners only.
        </p>
      </div>
    );
  }

  const set = (patch: Partial<ReportFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }));
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "page" && v !== "");
  const pages = Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE));
  const programmes = Array.from(new Set(cohorts.map((c) => c.programme_name))).sort();
  const visibleCohorts = filters.programme ? cohorts.filter((c) => c.programme_name === filters.programme) : cohorts;

  async function onExport() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const n = await exportReportCsv(filters);
      setNotice(`Exported ${n} ${n === 1 ? "record" : "records"}. The export has been recorded in the audit log.`);
    } catch (e) {
      setError(reportError(e));
    } finally {
      setExporting(false);
    }
  }

  const cards: { label: string; value: string }[] = metrics
    ? [
        { label: "Total registrations", value: String(metrics.total_registrations) },
        { label: "Confirmed students", value: String(metrics.confirmed_students) },
        { label: "Pending payments", value: String(metrics.pending_payments) },
        { label: "Successful payments", value: String(metrics.successful_payments) },
        { label: "Failed or cancelled attempts", value: String(metrics.failed_payments) },
        { label: "Verified revenue", value: formatNaira(metrics.verified_revenue) },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Cohort Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registrations, payments and enrolment. Revenue counts verified payments only.</p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={exporting || total === 0}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
        </Button>
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-primary/10 p-3 text-sm font-medium text-primary">{notice}</p>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!metrics && <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> Loading figures...</div>}
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      {filters.cohort && <p className="mt-2 text-xs text-muted-foreground">Figures above are for the selected cohort.</p>}

      {review.length > 0 && (
        <ReviewQueue
          items={review}
          isOwner={isOwner}
          onDone={(msg) => {
            setNotice(msg);
            setReload((k) => k + 1);
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {revenue.size > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Revenue by cohort</h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {cohorts.map((c) => {
              const r = revenue.get(c.id);
              if (!r) return null;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="font-medium">{c.title}</span>
                  <span className="text-muted-foreground">{r.registrations} registered, {r.paid} paid</span>
                  <span className="font-semibold">{formatNaira(r.verified_revenue)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Payments</h2>
        <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" className={inputClass + " pl-9"} value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, registration or payment reference" aria-label="Search payments" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm"><span className="mb-1 block font-medium">Programme</span>
              <select className={inputClass} value={filters.programme} onChange={(e) => set({ programme: e.target.value, cohort: "" })}>
                <option value="">All programmes</option>
                {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="text-sm"><span className="mb-1 block font-medium">Cohort</span>
              <select className={inputClass} value={filters.cohort} onChange={(e) => set({ cohort: e.target.value })}>
                <option value="">All cohorts</option>
                {visibleCohorts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label className="text-sm"><span className="mb-1 block font-medium">Payment status</span>
              <select className={inputClass} value={filters.payment} onChange={(e) => set({ payment: e.target.value })}>
                <option value="">All</option>
                <option value="unpaid">Registered, not yet paid</option>
                {Object.entries(PAYMENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <div />
            <label className="text-sm"><span className="mb-1 block font-medium">Registered from</span><input type="date" className={inputClass} value={filters.registeredFrom} onChange={(e) => set({ registeredFrom: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Registered to</span><input type="date" className={inputClass} value={filters.registeredTo} onChange={(e) => set({ registeredTo: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Paid from</span><input type="date" className={inputClass} value={filters.paidFrom} onChange={(e) => set({ paidFrom: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Paid to</span><input type="date" className={inputClass} value={filters.paidTo} onChange={(e) => set({ paidTo: e.target.value })} /></label>
          </div>
          {hasFilters && (
            <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => { setSearchText(""); setFilters(EMPTY_FILTERS); }}>
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-5" aria-live="polite">
          {loading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> Loading payments...</div>}
          {!loading && !error && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {hasFilters ? "No records match these filters." : "No registrations yet."}
            </div>
          )}

          {!loading && rows.length > 0 && (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{total} {total === 1 ? "record" : "records"}</p>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                {rows.map((r) => (
                  <li key={r.registration_id}>
                    <button type="button" aria-expanded={openId === r.registration_id}
                      onClick={() => setOpenId(openId === r.registration_id ? null : r.registration_id)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-secondary/40">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{r.full_name}</span>
                        <span className="block truncate text-sm text-muted-foreground">{r.email}</span>
                        <span className="block text-xs text-muted-foreground">{r.cohort_title}, {formatNaira(r.amount_due)}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1 text-xs">
                        <span className={`rounded-full px-3 py-1 font-semibold ${badge[r.payment_status] ?? badge.pending}`}>{PAYMENT_LABEL[r.payment_status] ?? r.payment_status}</span>
                        <span className="text-muted-foreground">
                          {r.registration_status === "enrolled" ? "Enrolment confirmed" : r.registration_status === "cancelled" ? "Cancelled" : "Not confirmed"}
                        </span>
                        {r.needs_review && <span className="font-semibold text-destructive">Payment held for review</span>}
                      </span>
                    </button>
                    {openId === r.registration_id && <Detail row={r} />}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Button variant="outline" size="sm" disabled={filters.page === 0} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}><ChevronLeft className="size-4" /> Previous</Button>
                <span className="text-muted-foreground">Page {filters.page + 1} of {pages}</span>
                <Button variant="outline" size="sm" disabled={filters.page + 1 >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next <ChevronRight className="size-4" /></Button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ row: r }: { row: ReportRow }) {
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const wa = whatsappLink(r.phone);

  useEffect(() => {
    fetchAttempts(r.registration_id).then(setAttempts).catch((e) => setErr(reportError(e)));
  }, [r.registration_id]);

  return (
    <div className="space-y-4 border-t border-border bg-secondary/20 px-5 py-4 text-sm">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Programme</dt><dd className="font-medium">{r.programme_name}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Registration reference</dt><dd className="font-medium">{r.registration_reference}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Tuition</dt><dd className="font-medium">{formatNaira(r.amount_due)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Amount paid (verified)</dt><dd className="font-medium">{r.paid_amount != null ? formatNaira(r.paid_amount) : "Nothing verified yet"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Payment method</dt><dd className="font-medium">{r.payment_method ?? "None"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Transaction reference</dt><dd className="font-medium">{r.payment_reference ?? "None"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Payment date</dt><dd className="font-medium">{fmtDateTime(r.paid_at)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Registered</dt><dd className="font-medium">{formatDate(r.registered_at.slice(0, 10))}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="font-medium">{r.phone}</dd></div>
      </dl>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary">
          <MessageCircle className="size-4" /> Open WhatsApp chat
        </a>
      )}

      <div>
        <h3 className="font-semibold">Payment attempts</h3>
        {err && <p role="alert" className="mt-2 text-destructive">{err}</p>}
        {!attempts && !err && <p className="mt-2 text-muted-foreground">Loading...</p>}
        {attempts && attempts.length === 0 && <p className="mt-2 text-muted-foreground">No online payment attempts yet.</p>}
        <ul className="mt-2 space-y-2">
          {attempts?.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-background p-3">
              <p className="font-medium">{ATTEMPT_LABEL[a.status] ?? a.status}, {formatNaira(a.amount_kobo / 100)}{a.channel ? `, ${a.channel}` : ""}</p>
              <p className="text-xs text-muted-foreground">Ref {a.reference}, started {fmtDateTime(a.created_at)}{a.paid_at ? `, paid ${fmtDateTime(a.paid_at)}` : ""}</p>
              {a.gateway_response && <p className="text-xs text-muted-foreground">Paystack: {a.gateway_response}</p>}
              {a.review_reason && <p className="text-xs text-destructive">{a.review_reason}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReviewQueue({
  items, isOwner, onDone, onError,
}: {
  items: ReviewRow[];
  isOwner: boolean;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [active, setActive] = useState<{ id: string; approve: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!active || busy) return;
    setBusy(true);
    try {
      await resolveReview(active.id, active.approve, note);
      setActive(null);
      setNote("");
      onDone(active.approve ? "Payment approved and the student enrolled." : "Payment dismissed.");
    } catch (e) {
      onError(reportError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-5" aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-lg font-semibold">Payments held for review ({items.length})</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These payments did not match what was expected, so nobody was enrolled automatically. Check the payment in your Paystack
        dashboard before deciding. Only the owner can approve; an admin can dismiss.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((p) => (
          <li key={p.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-semibold">{p.full_name} <span className="font-normal text-muted-foreground">({p.cohort_title})</span></p>
            <p className="text-muted-foreground">
              Expected {formatNaira(p.expected_kobo / 100)}, received {p.received_kobo != null ? formatNaira(p.received_kobo / 100) : "unknown"}.
              Ref {p.reference}, registration {p.registration_reference}.
            </p>
            {p.review_reason && <p className="mt-1 text-destructive">{p.review_reason}</p>}

            {active?.id === p.id ? (
              <div className="mt-3 space-y-2">
                <textarea rows={2} maxLength={300} className={inputClass} aria-label="Note explaining your decision"
                  placeholder={active.approve ? "Why you are approving this payment" : "Why you are dismissing this payment"}
                  value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy || note.trim().length < 5} onClick={submit}>
                    {active.approve ? "Confirm approval" : "Confirm dismissal"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setActive(null); setNote(""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                {isOwner && <Button size="sm" onClick={() => setActive({ id: p.id, approve: true })}>Approve</Button>}
                <Button size="sm" variant="outline" onClick={() => setActive({ id: p.id, approve: false })}>Dismiss</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
