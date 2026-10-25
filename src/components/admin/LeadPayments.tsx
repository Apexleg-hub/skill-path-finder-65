// Save as src/components/admin/LeadPayments.tsx
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { atLeast, useAdmin } from "@/lib/admin-access";
import { formatDate } from "@/lib/cohorts";
import {
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  fetchLeadPayments,
  fetchPaymentSummary,
  formatMoney,
  paymentError,
  recordPayment,
  setTuition,
  type PaymentMethod,
  type PaymentRow,
  type PaymentSummary,
} from "@/lib/payments";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const statusStyle = {
  pending: "bg-primary/10 text-primary",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-destructive/10 text-destructive",
} as const;

export function LeadPayments({ applicationId, onChanged }: { applicationId: string; onChanged: () => void }) {
  const admin = useAdmin();
  const isAdmin = atLeast(admin.role, "admin");

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [tuition, setTuitionText] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([fetchLeadPayments(applicationId), fetchPaymentSummary(applicationId)]);
    setPayments(p);
    setSummary(s);
    setTuitionText(s?.tuition_amount != null ? String(s.tuition_amount) : "");
  }, [applicationId]);

  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: paymentError(e) }));
  }, [load]);

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
      setMsg({ ok: false, text: paymentError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6">
      <h3 className="font-semibold">Payments</h3>

      <div aria-live="polite" className="mt-2">
        {msg && (
          <p role={msg.ok ? "status" : "alert"}
            className={`rounded-md p-3 text-sm font-medium ${msg.ok ? "bg-primary/10 text-primary" : "border border-destructive/40 bg-destructive/10 text-destructive"}`}>
            {msg.text}
          </p>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border p-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Agreed tuition</dt><dd className="font-medium">{summary?.tuition_amount != null ? formatMoney(summary.tuition_amount) : "Not set"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Verified paid</dt><dd className="font-medium">{formatMoney(summary?.verified_total ?? 0)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Awaiting verification</dt><dd className="font-medium">{formatMoney(summary?.pending_total ?? 0)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Outstanding</dt><dd className="font-medium">{summary?.outstanding != null ? formatMoney(summary.outstanding) : "Unknown until tuition is set"}</dd></div>
      </dl>

      {isAdmin && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Agreed tuition (NGN)</span>
            <input className={inputClass + " max-w-[200px]"} inputMode="decimal" value={tuition} onChange={(e) => setTuitionText(e.target.value)} />
          </label>
          <Button size="sm" variant="outline" disabled={busy}
            onClick={() => run(() => setTuition(applicationId, tuition.trim() === "" ? null : Number(tuition)), "Agreed tuition saved.")}>
            Save tuition
          </Button>
        </div>
      )}

      <form className="mt-4 space-y-2 rounded-xl border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await recordPayment({
              application_id: applicationId, amount: Number(amount), currency, payment_method: method,
              payment_reference: reference, payment_date: date || null,
            });
            setAmount(""); setReference(""); setDate("");
          }, "Payment recorded. It is pending until an admin verifies it.");
        }}>
        <p className="text-sm font-medium">Record a payment received</p>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Amount" className={inputClass} inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select aria-label="Currency" className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value as "NGN" | "USD")}>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </select>
          <select aria-label="Payment method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input aria-label="Payment date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <input aria-label="Payment reference" className={inputClass} placeholder="Bank reference or receipt number" value={reference} onChange={(e) => setReference(e.target.value)} />
        <Button type="submit" size="sm" disabled={busy}>Record payment</Button>
        <p className="text-xs text-muted-foreground">Recorded payments are never counted as paid until an admin verifies them.</p>
      </form>

      <ul className="mt-3 space-y-2">
        {payments.length === 0 && <li className="text-sm text-muted-foreground">No payments recorded yet.</li>}
        {payments.map((p) => (
          <li key={p.id} className="rounded-xl border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{formatMoney(p.amount, p.currency)}, {METHOD_LABEL[p.payment_method]}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[p.verification_status]}`}>{PAYMENT_STATUS_LABEL[p.verification_status]}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Ref {p.payment_reference}{p.payment_date ? `, paid ${formatDate(p.payment_date)}` : ""}</p>
            {p.rejection_reason && <p className="mt-1 text-xs text-destructive">Rejected: {p.rejection_reason}</p>}
          </li>
        ))}
      </ul>
      {payments.some((p) => p.verification_status === "pending") && (
        <p className="mt-2 text-xs text-muted-foreground">Pending payments are verified on the Payments page by an admin.</p>
      )}
    </section>
  );
}
