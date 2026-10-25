// Save as src/routes/admin.payments.tsx
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { atLeast, useAdmin } from "@/lib/admin-access";
import { formatDate } from "@/lib/cohorts";
import {
  METHOD_LABEL,
  PAYMENT_PAGE_SIZE,
  PAYMENT_STATUS_LABEL,
  fetchPayments,
  formatMoney,
  paymentError,
  verifyPayment,
  type PaymentRow,
} from "@/lib/payments";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
});

const statusStyle = {
  pending: "bg-primary/10 text-primary",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-destructive/10 text-destructive",
} as const;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function PaymentsPage() {
  const admin = useAdmin();
  const canView = atLeast(admin.role, "staff");
  const canVerify = atLeast(admin.role, "admin");

  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchPayments(status, page)
      .then((r) => {
        if (!active) return;
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => active && setError(paymentError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, page, reload, canView]);

  if (!canView) {
    return (
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Payments</h1>
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Payment records are available to staff, admins and owners.
        </p>
      </div>
    );
  }

  async function decide(p: PaymentRow, approve: boolean) {
    if (busyId) return;
    setBusyId(p.id);
    setError(null);
    setNotice(null);
    try {
      await verifyPayment(p.id, approve, approve ? undefined : reason);
      setNotice(approve ? "Payment verified." : "Payment rejected.");
      setRejecting(null);
      setReason("");
      setReload((k) => k + 1);
    } catch (e) {
      setError(paymentError(e));
    } finally {
      setBusyId(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAYMENT_PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Payments</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Course payments recorded by staff. Only an admin can verify them, after confirming the money in the bank account.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Payment status">
        {[["pending", "Pending"], ["verified", "Verified"], ["rejected", "Rejected"], ["", "All"]].map(([v, l]) => (
          <button key={l} type="button" role="tab" aria-selected={status === v}
            onClick={() => { setStatus(v); setPage(0); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === v ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-4 space-y-2">
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-primary/10 p-3 text-sm font-medium text-primary">{notice}</p>}
      </div>

      <div className="mt-6" aria-live="polite">
        {loading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> Loading payments...</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {status === "pending" ? "No payments are waiting for verification." : "No payments to show."}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">{total} {total === 1 ? "payment" : "payments"}</p>
            <ul className="space-y-3">
              {rows.map((p) => (
                <li key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.full_name}</p>
                      <p className="truncate text-sm text-muted-foreground">{p.course}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatMoney(p.amount, p.currency)}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[p.verification_status]}`}>{PAYMENT_STATUS_LABEL[p.verification_status]}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {METHOD_LABEL[p.payment_method]}, reference <span className="font-medium text-foreground">{p.payment_reference}</span>
                    {p.payment_date ? `, paid ${formatDate(p.payment_date)}` : ""}
                    {p.tuition_amount != null ? `, agreed tuition ${formatMoney(p.tuition_amount)}` : ", no agreed tuition set"}
                  </p>
                  {p.rejection_reason && <p className="mt-1 text-sm text-destructive">Rejected: {p.rejection_reason}</p>}
                  {p.entered_by === admin.userId && p.verification_status === "pending" && admin.role !== "owner" && (
                    <p className="mt-2 text-xs text-muted-foreground">You recorded this payment, so another admin or the owner must verify it.</p>
                  )}

                  {canVerify && p.verification_status === "pending" && (
                    <div className="mt-4">
                      {rejecting === p.id ? (
                        <div className="space-y-2">
                          <textarea rows={2} className={inputClass} aria-label="Reason for rejection" placeholder="Reason for rejecting this payment" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={busyId === p.id || reason.trim().length < 3} onClick={() => decide(p, false)}>Confirm rejection</Button>
                            <Button size="sm" variant="outline" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busyId === p.id}
                            onClick={() => { if (window.confirm(`Verify ${formatMoney(p.amount, p.currency)} from ${p.full_name}? Confirm you have seen it in the bank account.`)) decide(p, true); }}>
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => setRejecting(p.id)}>Reject</Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((n) => n - 1)}><ChevronLeft className="size-4" /> Previous</Button>
              <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((n) => n + 1)}>Next <ChevronRight className="size-4" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
