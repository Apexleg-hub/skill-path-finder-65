// Save as src/routes/admin.leads.tsx
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Phone, Mail, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadPayments } from "@/components/admin/LeadPayments";
import { atLeast, useAdmin } from "@/lib/admin-access";
import { formatDate } from "@/lib/cohorts";
import {
  PAGE_SIZE,
  STATUS_LABEL,
  addCommunication,
  addNote,
  fetchCourses,
  fetchLeadById,
  fetchLeadHistory,
  fetchLeads,
  leadError,
  recordOptOut,
  updateLead,
  whatsappLink,
  type Channel,
  type CommLog,
  type DeliveryStatus,
  type LeadFilters,
  type LeadNote,
  type LeadRow,
  type LeadStatus,
  type MessageType,
} from "@/lib/leads";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsPage,
});

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const statusStyle: Record<LeadStatus, string> = {
  unknown: "bg-muted text-muted-foreground",
  new: "bg-primary/10 text-primary",
  contacted: "bg-secondary text-secondary-foreground",
  enrolled: "bg-green-100 text-green-800",
  not_interested: "bg-muted text-muted-foreground",
};

const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "Never";

const EMPTY: LeadFilters = { q: "", course: "", status: "", followUp: "", from: "", to: "", page: 0 };

function LeadsPage() {
  const admin = useAdmin();
  const allowed = atLeast(admin.role, "staff");

  const [filters, setFilters] = useState<LeadFilters>(EMPTY);
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    fetchCourses().then(setCourses).catch(() => setCourses([]));
  }, [allowed]);

  // Search box: wait a moment after typing before querying.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === searchText ? f : { ...f, q: searchText, page: 0 })), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchLeads(filters)
      .then((r) => {
        if (!active) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => active && setError(leadError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters, allowed, reloadKey]);

  const set = (patch: Partial<LeadFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }));
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "page" && v !== "");
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!allowed) {
    return (
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Leads</h1>
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Lead records contain personal information and are available to staff, admins and owners only.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Course applications and their follow-up status.</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, email or phone"
            aria-label="Search leads"
            className={inputClass + " pl-9"}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Course</span>
            <select className={inputClass} value={filters.course} onChange={(e) => set({ course: e.target.value })}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select className={inputClass} value={filters.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Follow-up</span>
            <select className={inputClass} value={filters.followUp} onChange={(e) => set({ followUp: e.target.value })}>
              <option value="">Any</option>
              <option value="due">Due or overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">No date set</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Applied from</span>
            <input type="date" className={inputClass} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Applied to</span>
            <input type="date" className={inputClass} value={filters.to} onChange={(e) => set({ to: e.target.value })} />
          </label>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            onClick={() => {
              setSearchText("");
              setFilters(EMPTY);
            }}
          >
            <X className="size-4" /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {loading && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" /> Loading leads...
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {hasFilters ? "No leads match these filters." : "No applications yet."}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {total} {total === 1 ? "lead" : "leads"}
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {rows.map((r) => (
                <li key={r.application_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-secondary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.full_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{r.course}</span>
                      <span className="block text-xs text-muted-foreground">Applied {formatDate(r.applied_at.slice(0, 10))}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1 text-xs">
                      <span className={`rounded-full px-3 py-1 font-semibold ${statusStyle[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      {r.follow_up_date && <span className="text-muted-foreground">Follow up {formatDate(r.follow_up_date)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={filters.page === 0}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-muted-foreground">Page {filters.page + 1} of {pages}</span>
              <Button variant="outline" size="sm" disabled={filters.page + 1 >= pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {selected && (
        <LeadDrawer
          lead={selected}
          myId={admin.userId}
          onClose={() => setSelected(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function LeadDrawer({
  lead: initial,
  myId,
  onClose,
  onChanged,
}: {
  lead: LeadRow;
  myId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [lead, setLead] = useState(initial);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [followUp, setFollowUp] = useState(initial.follow_up_date ?? "");
  const [noteText, setNoteText] = useState("");

  const refresh = useCallback(async () => {
    const [fresh, history] = await Promise.all([fetchLeadById(initial.application_id), fetchLeadHistory(initial.application_id)]);
    if (fresh) {
      setLead(fresh);
      setFollowUp(fresh.follow_up_date ?? "");
    }
    setNotes(history.notes);
    setLogs(history.logs);
    onChanged();
  }, [initial.application_id, onChanged]);

  useEffect(() => {
    fetchLeadHistory(initial.application_id)
      .then((h) => {
        setNotes(h.notes);
        setLogs(h.logs);
      })
      .catch((e) => setMsg({ type: "err", text: leadError(e) }));
  }, [initial.application_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await action();
      await refresh();
      setMsg({ type: "ok", text: success });
    } catch (e) {
      setMsg({ type: "err", text: leadError(e) });
    } finally {
      setBusy(false);
    }
  }

  const wa = whatsappLink(lead.phone);
  const closed = lead.status === "enrolled" || lead.status === "not_interested";

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Lead: ${lead.full_name}`}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-background p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{lead.full_name}</h2>
            <p className="text-sm text-muted-foreground">{lead.course}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} autoFocus aria-label="Close panel">
            <X className="size-4" />
          </Button>
        </div>

        <div aria-live="polite" className="mt-3">
          {msg && (
            <p role={msg.type === "err" ? "alert" : "status"}
              className={`rounded-md p-3 text-sm font-medium ${msg.type === "err" ? "border border-destructive/40 bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              {msg.text}
            </p>
          )}
        </div>

        <section className="mt-4 space-y-2 text-sm">
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary"><Mail className="size-4" /> {lead.email}</a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-primary"><Phone className="size-4" /> {lead.phone}</a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary">
              <MessageCircle className="size-4" /> Open WhatsApp chat
            </a>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border p-4">
            <Detail label="Applied" value={formatDate(lead.applied_at.slice(0, 10))} />
            <Detail label="Format" value={lead.learning_format} />
            <Detail label="Experience" value={lead.experience_level} />
            <Detail label="Occupation" value={lead.occupation} />
            <Detail label="Source" value={lead.source} />
            <Detail label="Last contact" value={fmtDateTime(lead.last_contact_at)} />
          </dl>
          {lead.message && (
            <p className="rounded-xl border border-border p-4 text-muted-foreground"><span className="font-medium text-foreground">Message: </span>{lead.message}</p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="font-semibold">Status</h3>
          <p className="mt-1 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[lead.status]}`}>{STATUS_LABEL[lead.status]}</span>
            {lead.contacted_at && <span className="ml-2 text-muted-foreground">Contacted {fmtDateTime(lead.contacted_at)}</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy || lead.status === "contacted"}
              onClick={() => run(() => updateLead(lead.application_id, { status: "contacted" }), "Marked as contacted.")}>Mark contacted</Button>
            <Button size="sm" variant="outline" disabled={busy || lead.status === "enrolled"}
              onClick={() => run(() => updateLead(lead.application_id, { status: "enrolled" }), "Marked as enrolled.")}>Mark enrolled</Button>
            <Button size="sm" variant="outline" disabled={busy || lead.status === "not_interested"}
              onClick={() => run(() => updateLead(lead.application_id, { status: "not_interested" }), "Marked as not interested.")}>Not interested</Button>
            {closed && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => run(() => updateLead(lead.application_id, { status: "contacted" }), "Lead reopened as contacted.")}>Reopen</Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Marking a lead as enrolled here records the status only. Verified payments are handled separately.
          </p>
        </section>

        {!closed && (
          <section className="mt-6">
            <h3 className="font-semibold">Follow-up date</h3>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <input type="date" aria-label="Follow-up date" className={inputClass + " max-w-[200px]"} value={followUp}
                onChange={(e) => setFollowUp(e.target.value)} />
              <Button size="sm" disabled={busy}
                onClick={() => run(() => updateLead(lead.application_id, { follow_up_date: followUp || null }), followUp ? "Follow-up date saved." : "Follow-up date cleared.")}>
                Save
              </Button>
            </div>
          </section>
        )}

        <LeadPayments applicationId={lead.application_id} onChanged={refresh} />

        <section className="mt-6">
          <h3 className="font-semibold">Internal notes</h3>
          <form className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => { await addNote(lead.application_id, noteText); setNoteText(""); }, "Note added.");
            }}>
            <textarea rows={3} maxLength={2000} className={inputClass} value={noteText}
              onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note for the team" aria-label="New note" />
            <Button type="submit" size="sm" disabled={busy || noteText.trim().length === 0}>Add note</Button>
          </form>
          <ul className="mt-3 space-y-2">
            {notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.author_id === myId ? "You" : "Staff member"}, {fmtDateTime(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <CommSection leadId={lead.application_id} logs={logs} myId={myId} busy={busy} run={run} />

        <section className="mt-6 rounded-xl border border-border p-4 text-sm">
          <h3 className="font-semibold">Marketing consent</h3>
          <p className="mt-1 text-muted-foreground">
            {lead.marketing_consent === "granted" && "This person agreed to marketing messages."}
            {lead.marketing_consent === "unknown" && "No marketing consent is recorded. Do not send marketing messages."}
            {lead.marketing_consent === "declined" && "This person opted out. Do not send marketing messages."}
          </p>
          {lead.marketing_consent !== "declined" && (
            <Button size="sm" variant="outline" className="mt-3" disabled={busy}
              onClick={() => {
                if (window.confirm("Record that this person has opted out of marketing? This cannot be undone here.")) {
                  run(() => recordOptOut(lead.application_id), "Opt-out recorded.");
                }
              }}>
              Record opt-out
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "Not given"}</dd>
    </div>
  );
}

function CommSection({
  leadId,
  logs,
  myId,
  busy,
  run,
}: {
  leadId: string;
  logs: CommLog[];
  myId: string;
  busy: boolean;
  run: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [type, setType] = useState<MessageType>("follow_up");
  const [direction, setDirection] = useState<"outbound" | "inbound">("outbound");
  const [delivery, setDelivery] = useState<DeliveryStatus>("logged");
  const [summary, setSummary] = useState("");

  return (
    <section className="mt-6">
      <h3 className="font-semibold">Communication history</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Log contact you made yourself. This records it only; nothing is sent from here.
      </p>
      <form className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await addCommunication({
              application_id: leadId, channel, message_type: type, direction,
              delivery_status: delivery, summary, contacted_at: new Date().toISOString(),
            });
            setSummary("");
          }, "Communication logged.");
        }}>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Channel" className={inputClass} value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="phone">Phone call</option>
            <option value="sms">SMS</option>
            <option value="in_person">In person</option>
          </select>
          <select aria-label="Message type" className={inputClass} value={type} onChange={(e) => setType(e.target.value as MessageType)}>
            <option value="welcome">Welcome</option>
            <option value="follow_up">Follow-up</option>
            <option value="payment_reminder">Payment reminder</option>
            <option value="general">General</option>
            <option value="marketing">Marketing</option>
          </select>
          <select aria-label="Direction" className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value as "outbound" | "inbound")}>
            <option value="outbound">We contacted them</option>
            <option value="inbound">They contacted us</option>
          </select>
          <select aria-label="Delivery status" className={inputClass} value={delivery} onChange={(e) => setDelivery(e.target.value as DeliveryStatus)}>
            <option value="logged">Logged</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <textarea rows={2} maxLength={1000} className={inputClass} value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder="Short summary (optional)" aria-label="Summary" />
        <Button type="submit" size="sm" disabled={busy}>Log communication</Button>
      </form>

      <ul className="mt-3 space-y-2">
        {logs.length === 0 && <li className="text-sm text-muted-foreground">No communication logged yet.</li>}
        {logs.map((l) => (
          <li key={l.id} className="rounded-xl border border-border p-3 text-sm">
            <p className="font-medium capitalize">
              {l.channel.replace("_", " ")}, {l.message_type.replace("_", " ")}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {l.direction === "inbound" ? "inbound" : "outbound"}, {l.delivery_status}
              </span>
            </p>
            {l.summary && <p className="mt-1 text-muted-foreground">{l.summary}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {l.staff_id === myId ? "You" : "Staff member"}, {fmtDateTime(l.contacted_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
