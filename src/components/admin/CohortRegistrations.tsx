// Save as src/components/admin/CohortRegistrations.tsx
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatNaira } from "@/lib/cohorts";
import {
  REG_PAGE_SIZE,
  cohortError,
  exportRegistrationsCsv,
  fetchRegistrationPayments,
  fetchRegistrations,
  setRegistrationCancelled,
  verifyCohortPayment,
  type CohortPaymentRow,
  type RegFilters,
  type RegistrationRow,
} from "@/lib/cohort-admin";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const PAYMENT_LABEL: Record<RegistrationRow["payment_status"], string> = {
  pending: "Pending",
  submitted: "Submitted for verification",
  partially_paid: "Partially paid",
  paid: "Paid",
  rejected: "Rejected",
};

const REG_LABEL: Record<RegistrationRow["registration_status"], string> = {
  registered: "Registered",
  enrolled: "Enrolled",
  cancelled: "Cancelled",
};

const badge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  enrolled: "bg-green-100 text-green-800",
  submitted: "bg-primary/10 text-primary",
  partially_paid: "bg-secondary text-secondary-foreground",
  pending: "bg-muted text-muted-foreground",
  registered: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
  verified: "bg-green-100 text-green-800",
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const EMPTY: RegFilters = { q: "", registration: "", payment: "", page: 0 };

export function CohortRegistrations({
  cohort,
  onBack,
}: {
  cohort: { id: string; title: string; slug: string };
  onBack: () => void;
}) {
  const [filters, setFilters] = useState<RegFilters>(EMPTY);
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === searchText ? f : { ...f, q: searchText, page: 0 })), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchRegistrations(cohort.id, filters)
      .then((r) => {
        if (!active) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => active && setError(cohortError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [cohort.id, filters, reload]);

  const pages = Math.max(1, Math.ceil(total / REG_PAGE_SIZE));
  const hasFilters = filters.q !== "" || filters.registration !== "" || filters.payment !== "";

  async function onExport() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      const n = await exportRegistrationsCsv(cohort.id, cohort.slug);
      setNotice(`Exported ${n} ${n === 1 ? "registration" : "registrations"}. The export has been recorded in the audit log.`);
    } catch (e) {
      setError(cohortError(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-sm font-semibold text-primary">Back to cohorts</button>
          <h2 className="mt-1 text-xl font-bold">Registrations: {cohort.title}</h2>
        </div>
        <Button variant="outline" onClick={onExport} disabled={exporting || total === 0}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
        </Button>
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-primary/10 p-3 text-sm font-medium text-primary">{notice}</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" className={inputClass + " pl-9"} value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, email or reference" aria-label="Search registrations" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="mb-1 block font-medium">Registration status</span>
            <select className={inputClass} value={filters.registration} onChange={(e) => setFilters((f) => ({ ...f, registration: e.target.value, page: 0 }))}>
              <option value="">All</option>
              {Object.entries(REG_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm"><span className="mb-1 block font-medium">Payment status</span>
            <select className={inputClass} value={filters.payment} onChange={(e) => setFilters((f) => ({ ...f, payment: e.target.value, page: 0 }))}>
              <option value="">All</option>
              {Object.entries(PAYMENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        {hasFilters && (
          <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => { setSearchText(""); setFilters(EMPTY); }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {loading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> Loading registrations...</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {hasFilters ? "No registrations match these filters." : "No registrations yet."}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">{total} {total === 1 ? "registration" : "registrations"}</p>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {rows.map((r) => (
                <li key={r.id}>
                  <button type="button" aria-expanded={openId === r.id} onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-secondary/40">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.full_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{r.email}</span>
                      <span className="block text-xs text-muted-foreground">{r.registration_reference}, {formatDate(r.registered_at.slice(0, 10))}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1 text-xs">
                      <span className={`rounded-full px-3 py-1 font-semibold ${badge[r.registration_status]}`}>{REG_LABEL[r.registration_status]}</span>
                      <span className={`rounded-full px-3 py-1 font-semibold ${badge[r.payment_status]}`}>{PAYMENT_LABEL[r.payment_status]}</span>
                    </span>
                  </button>
                  {openId === r.id && (
                    <RegistrationDetail reg={r} onChanged={() => { setReload((k) => k + 1); }} />
                  )}
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
    </div>
  );
}

function RegistrationDetail({ reg, onChanged }: { reg: RegistrationRow; onChanged: () => void }) {
  const [payments, setPayments] = useState<CohortPaymentRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => fetchRegistrationPayments(reg.id).then(setPayments).catch((e) => setMsg({ ok: false, text: cohortError(e) }));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reg.id]);

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await action();
      await load();
      onChanged();
      setMsg({ ok: true, text: success });
    } catch (e) {
      setMsg({ ok: false, text: cohortError(e) });
    } finally {
      setBusy(false);
    }
  }

  const cancelled = reg.registration_status === "cancelled";

  return (
    <div className="space-y-4 border-t border-border bg-secondary/20 px-5 py-4 text-sm">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Phone (WhatsApp)</dt><dd className="font-medium">{reg.phone}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Experience level</dt><dd className="font-medium capitalize">{reg.experience_level}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Payment option</dt><dd className="font-medium capitalize">{reg.payment_option ?? "Not chosen"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Amount due</dt><dd className="font-medium">{formatNaira(Number(reg.amount_due))}{reg.early_bird_applied ? " (early-bird)" : ""}</dd></div>
      </dl>
      {reg.learning_goal && <p className="rounded-xl border border-border bg-background p-3 text-muted-foreground"><span className="font-medium text-foreground">Reason for joining: </span>{reg.learning_goal}</p>}

      <div aria-live="polite">
        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-md p-3 font-medium ${msg.ok ? "bg-primary/10 text-primary" : "border border-destructive/40 bg-destructive/10 text-destructive"}`}>{msg.text}</p>}
      </div>

      <div>
        <h3 className="font-semibold">Payments submitted</h3>
        {!payments && <p className="mt-2 text-muted-foreground">Loading...</p>}
        {payments && payments.length === 0 && <p className="mt-2 text-muted-foreground">No payment details submitted yet.</p>}
        <ul className="mt-2 space-y-2">
          {payments?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <div>
                <p className="font-medium">{formatNaira(Number(p.amount))}, ref {p.payment_reference}</p>
                <p className="text-xs text-muted-foreground">
                  {p.payment_date ? `Paid ${formatDate(p.payment_date)}, ` : ""}submitted {fmtDateTime(p.created_at)}
                  {p.verified_at ? `, decided ${fmtDateTime(p.verified_at)}` : ""}
                </p>
              </div>
              {p.verification_status === "submitted" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => run(() => verifyCohortPayment(p.id, true), "Payment verified.")}>Verify</Button>
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => { if (window.confirm("Reject this payment? This cannot be undone.")) run(() => verifyCohortPayment(p.id, false), "Payment rejected."); }}>Reject</Button>
                </div>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[p.verification_status]}`}>{p.verification_status}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Verify only after you have seen the money in the bank account. Verified payments update the student's payment and enrolment status.
        </p>
      </div>

      <Button size="sm" variant="outline" disabled={busy}
        onClick={() => {
          const q = cancelled ? "Reinstate this registration?" : "Cancel this registration? The seat is released.";
          if (window.confirm(q)) run(() => setRegistrationCancelled(reg.id, !cancelled), cancelled ? "Registration reinstated." : "Registration cancelled.");
        }}>
        {cancelled ? "Reinstate registration" : "Cancel registration"}
      </Button>
    </div>
  );
}
