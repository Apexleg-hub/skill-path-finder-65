// Save as src/routes/admin.cohorts.tsx
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortEditor } from "@/components/admin/CohortEditor";
import { CohortRegistrations } from "@/components/admin/CohortRegistrations";
import { atLeast, useAdmin } from "@/lib/admin-access";
import {
  cohortError,
  fetchAdminCohorts,
  setPublication,
  setRegistrationOpen,
  type CohortListItem,
} from "@/lib/cohort-admin";
import { STATUS_LABEL, deriveStatus, formatDate, formatNaira } from "@/lib/cohorts";

export const Route = createFileRoute("/admin/cohorts")({
  component: CohortsAdmin,
});

type View = { name: "list" } | { name: "edit"; id: string | null } | { name: "registrations"; id: string };

const pubStyle = {
  published: "bg-green-100 text-green-800",
  draft: "bg-muted text-muted-foreground",
  unpublished: "bg-secondary text-secondary-foreground",
} as const;

function CohortsAdmin() {
  const admin = useAdmin();
  const allowed = atLeast(admin.role, "admin");
  const [view, setView] = useState<View>({ name: "list" });
  const [cohorts, setCohorts] = useState<CohortListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return fetchAdminCohorts()
      .then(setCohorts)
      .catch((e) => setError(cohortError(e)));
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Cohorts</h1>
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Cohort management is available to admins and owners only.
        </p>
      </div>
    );
  }

  async function act(c: CohortListItem, action: () => Promise<void>, success: string) {
    if (busyId) return;
    setBusyId(c.id);
    setError(null);
    setNotice(null);
    try {
      await action();
      await load();
      setNotice(success);
    } catch (e) {
      setError(cohortError(e));
    } finally {
      setBusyId(null);
    }
  }

  if (view.name === "edit") {
    return (
      <CohortEditor
        cohortId={view.id}
        onCancel={() => setView({ name: "list" })}
        onDone={async () => {
          await load();
          setNotice("Cohort saved.");
          setView({ name: "list" });
        }}
      />
    );
  }

  if (view.name === "registrations") {
    const c = cohorts?.find((x) => x.id === view.id);
    if (!c) return null;
    return <CohortRegistrations cohort={{ id: c.id, title: c.title, slug: c.slug }} onBack={() => setView({ name: "list" })} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Cohorts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, publish and manage training cohorts.</p>
        </div>
        <Button variant="cta" onClick={() => { setNotice(null); setView({ name: "edit", id: null }); }}>
          <Plus className="size-4" /> New cohort
        </Button>
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-primary/10 p-3 text-sm font-medium text-primary">{notice}</p>}
      </div>

      {!cohorts && !error && (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" /> Loading cohorts...
        </div>
      )}

      {cohorts && cohorts.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No cohorts yet. Create your first one with "New cohort".
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {cohorts?.map((c) => {
          const derived = deriveStatus(c, c.seat_capacity != null ? Math.max(c.seat_capacity - c.summary.registrations, 0) : null);
          const isPublished = c.publication_status === "published";
          const regOpen = c.cohort_status === "open";
          const busy = busyId === c.id;
          return (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{c.title} <span className="text-sm font-normal text-muted-foreground">(Cohort {c.cohort_number})</span></h2>
                  <p className="text-sm text-muted-foreground">
                    {c.programme_name}, starts {formatDate(c.start_date)}, register by {formatDate(c.registration_deadline)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold capitalize ${pubStyle[c.publication_status]}`}>{c.publication_status}</span>
                  {isPublished && <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">{STATUS_LABEL[derived]}</span>}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Registrations</dt><dd className="font-semibold">{c.summary.registrations}{c.seat_capacity ? ` of ${c.seat_capacity}` : ""}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Paid students</dt><dd className="font-semibold">{c.summary.paid}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Verified revenue</dt><dd className="font-semibold">{formatNaira(c.summary.verified_revenue)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tuition</dt><dd className="font-semibold">{formatNaira(c.tuition_fee)}</dd></div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => { setNotice(null); setView({ name: "edit", id: c.id }); }}>Edit</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setView({ name: "registrations", id: c.id })}>Registrations</Button>
                {isPublished ? (
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => { if (window.confirm("Unpublish this cohort? It disappears from the public site immediately.")) act(c, () => setPublication(c.id, "unpublished"), "Cohort unpublished."); }}>
                    Unpublish
                  </Button>
                ) : (
                  <Button size="sm" disabled={busy}
                    onClick={() => { if (window.confirm("Publish this cohort? It becomes visible to the public. Registration opens only when you also open it.")) act(c, () => setPublication(c.id, "published"), "Cohort published."); }}>
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy}
                  onClick={() => act(c, () => setRegistrationOpen(c.id, !regOpen), regOpen ? "Registration closed." : "Registration opened.")}>
                  {regOpen ? "Close registration" : "Open registration"}
                </Button>
                {isPublished && <a href={`/cohorts/${c.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 text-sm font-semibold text-primary">View public page</a>}
              </div>
              {!isPublished && <p className="mt-2 text-xs text-muted-foreground">Publishing requires a start date, tuition fee and registration deadline.</p>}
              {isPublished && regOpen && derived !== "open" && (
                <p className="mt-2 text-xs text-muted-foreground">Registration is switched on, but the public page shows "{STATUS_LABEL[derived]}" because of the dates or seats.</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
