// Save as src/routes/cohorts.$slug.register.tsx  (replaces the previous version)
// Same-page registration and Paystack payment.
// Needs:  npm install @paystack/inline-js
//         the phase4 database migration and the three paystack Edge Functions deployed.
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";
import { fetchCohortDetail, formatDate, formatNaira, type CohortDetail } from "@/lib/cohorts";

export const Route = createFileRoute("/cohorts/$slug/register")({
  loader: async ({ params }) => {
    const result = await fetchCohortDetail(params.slug);
    if (!result) throw notFound();
    return result.cohort;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Register for ${loaderData.title} | Corepoint Tech Academy` : "Register | Corepoint Tech Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Cohort not found</h1>
      <p className="mt-3 text-muted-foreground">This cohort is not available for registration.</p>
      <Button asChild variant="cta" className="mt-6">
        <Link to="/cohorts">View All Cohorts</Link>
      </Button>
    </div>
  ),
  component: RegisterPage,
});

const EXPERIENCE = [
  { value: "beginner", label: "Beginner (new to this field)" },
  { value: "intermediate", label: "Intermediate (some experience)" },
  { value: "advanced", label: "Advanced (working in this field)" },
];

type Stage = "checking" | "form" | "working" | "pending" | "verifying" | "paid" | "review";

type Status = {
  registration_reference: string;
  full_name: string;
  email: string;
  cohort_title: string;
  cohort_slug: string;
  programme_name: string;
  start_date: string | null;
  amount_due: number;
  payment_status: string;
  registration_status: string;
  last_attempt_status: string | null;
  paid_reference: string | null;
  paid_at: string | null;
  payment_channel: string | null;
};

type Bank = { bank_name: string | null; account_name: string | null; account_number: string | null; instructions: string | null };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function friendlyError(err: { code?: string; message?: string } | null): string {
  if (!err) return "Something went wrong. Please try again.";
  if (err.code === "P0001" && err.message) return err.message;
  return "We could not complete your request. Please check your connection and try again.";
}

// Calls one of our Paystack Edge Functions and returns a readable error on failure.
// Technical details go to the browser console (F12) to help with setup; they never include secrets.
async function callFn<T>(name: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (!error) return { ok: true, data: data as T };

  let message = "Something went wrong. Please try again.";
  const kind = (error as { name?: string }).name;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (error as any).context;
  console.error(`[${name}] request failed:`, kind, ctx?.status ?? "", error.message);
  if (kind === "FunctionsFetchError") {
    message = "We could not reach the payment service. Please check your connection and try again.";
  }
  try {
    if (ctx && typeof ctx.json === "function") {
      const j = await ctx.json();
      if (j?.error) message = String(j.error);
      else console.error(`[${name}] response:`, j);
    }
  } catch {
    /* keep the message above */
  }
  return { ok: false, error: message };
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function RegisterPage() {
  const c = Route.useLoaderData();
  const storageKey = `cpt:pay:${c.slug}`;
  const open = c.status === "open";
  const price = c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee;

  const [stage, setStage] = useState<Stage>("checking");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [label, setLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResume, setShowResume] = useState(false);
  const openedAt = useRef(Date.now());
  const busy = useRef(false);

  const [values, setValues] = useState({ full_name: "", email: "", phone: "", experience_level: "", consent: false });
  const setValue = (k: keyof typeof values, v: string | boolean) => setValues((s) => ({ ...s, [k]: v }));

  async function loadStatus(tok: string): Promise<Status | null> {
    const { data, error: e } = await supabase.rpc("get_payment_status" as never, { p_pay_token: tok } as never);
    const row = !e && Array.isArray(data) ? (data[0] as Status | undefined) : undefined;
    return row ?? null;
  }

  async function showFromStatus(tok: string) {
    const row = await loadStatus(tok);
    if (!row) {
      localStorage.removeItem(storageKey);
      setToken(null);
      setStatus(null);
      setStage("form");
      return;
    }
    setToken(tok);
    setStatus(row);
    setStage(row.payment_status === "paid" ? "paid" : "pending");
  }

  // On load: pick up a saved registration (refresh, return later, or return from the redirect fallback).
  useEffect(() => {
    let active = true;
    (async () => {
      // A private link from the registration email: remember it, then tidy the address bar.
      const resume = new URLSearchParams(window.location.search).get("resume");
      if (resume && /^[0-9a-f-]{36}$/i.test(resume)) {
        try {
          localStorage.setItem(storageKey, resume);
        } catch {
          /* ignore */
        }
        window.history.replaceState({}, "", window.location.pathname);
      }
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(storageKey);
      } catch {
        saved = null;
      }
      if (!saved) {
        if (active) setStage("form");
        return;
      }
      await showFromStatus(saved);
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (active && ref) {
        window.history.replaceState({}, "", window.location.pathname);
        await verify(saved, ref);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Asks the server (which asks Paystack) whether the payment really succeeded.
  async function verify(tok: string, reference?: string) {
    setStage("verifying");
    setError(null);
    setNotice(null);
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await callFn<{ result: string }>("paystack-verify", { pay_token: tok, reference });
      const result = res.ok ? res.data.result : "unavailable";
      if (result === "paid") {
        await showFromStatus(tok);
        return;
      }
      if (result === "failed" || result === "abandoned") {
        await showFromStatus(tok);
        setError("That payment was not completed. You can try again below.");
        return;
      }
      if (result === "review") {
        setStage("review");
        return;
      }
      await sleep(2500);       // pending or temporarily unavailable: keep checking
    }
    // Still undecided: stay on the verifying screen with a manual "check again".
    setStage("verifying");
    setNotice("We are still confirming your payment. This can take a minute.");
  }

  async function startPayment(tok: string) {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setNotice(null);
    setStage("working");
    setLabel("Starting secure payment...");

    const res = await callFn<{ status: string; access_code?: string; authorization_url?: string; reference?: string }>(
      "paystack-initialize",
      { pay_token: tok },
    );
    if (!res.ok) {
      busy.current = false;
      await showFromStatus(tok);
      setError(res.error);
      return;
    }
    if (res.data.status === "paid") {
      busy.current = false;
      await showFromStatus(tok);
      return;
    }

    const { access_code, authorization_url, reference } = res.data;
    if (!access_code || !reference) {
      busy.current = false;
      await showFromStatus(tok);
      setError("We could not start the payment. Please try again.");
      return;
    }

    setLabel("Opening secure checkout...");
    try {
      // Loaded only in the browser.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import("@paystack/inline-js");
      const Paystack = mod.default ?? mod;
      const popup = new Paystack();
      let loaded = false;
      // If the popup has not appeared after 10 seconds, fall back to Paystack's full-page checkout.
      const timer = setTimeout(() => {
        if (!loaded && authorization_url) window.location.href = authorization_url;
      }, 10000);

      popup.resumeTransaction(access_code, {
        onLoad: () => {
          loaded = true;
          clearTimeout(timer);
          setLabel("Complete your payment in the Paystack window.");
        },
        onSuccess: async () => {
          clearTimeout(timer);
          busy.current = false;
          await verify(tok, reference);          // the popup's message is never treated as proof
        },
        onCancel: async () => {
          clearTimeout(timer);
          busy.current = false;
          await showFromStatus(tok);
          setNotice("Your registration has been saved, but payment has not been confirmed.");
        },
        onError: async () => {
          clearTimeout(timer);
          busy.current = false;
          await showFromStatus(tok);
          setError("The payment window had a problem. Please try again.");
        },
      });
    } catch {
      busy.current = false;
      if (authorization_url) {
        window.location.href = authorization_url;
        return;
      }
      await showFromStatus(tok);
      setError("We could not open the payment window. Please try again.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    setError(null);
    setNotice(null);

    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const next: Record<string, string> = {};
    if (values.full_name.trim().length < 2) next.full_name = "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next.email = "Please enter a valid email address.";
    if (!/^\+?[0-9\s-]{7,20}$/.test(values.phone.trim())) next.phone = "Enter a valid WhatsApp number, for example +234 801 234 5678.";
    if (!values.experience_level) next.experience_level = "Please select your experience level.";
    if (!values.consent) next.consent = "You must accept the privacy policy to register.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (Date.now() - openedAt.current < 2000) {
      setError("Please review your details and try again.");
      return;
    }

    busy.current = true;
    setStage("working");
    setLabel("Saving your registration...");
    const { data, error: rpcError } = await supabase.rpc(
      "register_for_cohort" as never,
      {
        p_slug: c.slug,
        p_full_name: values.full_name.trim(),
        p_email: values.email.trim(),
        p_phone: values.phone.trim(),
        p_experience_level: values.experience_level,
        p_learning_goal: null,
        p_payment_option: c.payment_options.includes("full") ? "full" : null,
        p_consent: true,
        p_website: v("website"),            // honeypot, must stay empty
      } as never,
    );
    busy.current = false;

    const row = Array.isArray(data)
      ? (data[0] as (Bank & { registration_reference: string; pay_token: string }) | undefined)
      : undefined;
    if (rpcError || !row?.pay_token) {
      setStage("form");                      // the typed details are kept
      const msg = friendlyError(rpcError as { code?: string; message?: string } | null);
      setError(msg);
      if (/already registered/i.test(msg)) setShowResume(true);
      return;
    }

    try {
      localStorage.setItem(storageKey, row.pay_token);
    } catch {
      /* private browsing: the page still works for this visit */
    }
    setBank({ bank_name: row.bank_name, account_name: row.account_name, account_number: row.account_number, instructions: row.instructions });
    setToken(row.pay_token);
    await startPayment(row.pay_token);
  }

  function startOver() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setToken(null);
    setStatus(null);
    setError(null);
    setNotice(null);
    setStage("form");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
      <Link to="/cohorts/$slug" params={{ slug: c.slug }} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to cohort details
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Register for {c.title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div aria-live="polite">
          {stage === "checking" && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          )}

          {stage === "working" && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card" role="status">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
              <p className="mt-4 font-semibold">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">Please do not close or refresh this page.</p>
            </div>
          )}

          {stage === "verifying" && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card" role="status">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Verifying payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {notice ?? "We are confirming your payment with Paystack. Your enrolment is confirmed only after this succeeds."}
              </p>
              {notice && token && (
                <Button className="mt-5" variant="outline" onClick={() => verify(token)}>Check again</Button>
              )}
            </div>
          )}

          {stage === "review" && (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <h2 className="text-xl font-semibold">We are reviewing your payment</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We received your payment but need to check it before confirming your enrolment. Our team will contact you
                shortly. Please keep your registration reference
                {status ? <> <strong>{status.registration_reference}</strong></> : null}.
              </p>
            </div>
          )}

          {stage === "paid" && status && <Success status={status} onStartOver={startOver} />}

          {stage === "pending" && status && token && (
            <Pending
              status={status}
              cohort={c}
              bank={bank}
              error={error}
              notice={notice}
              onRetry={() => startPayment(token)}
              onStartOver={startOver}
            />
          )}

          {stage === "form" && (
            <>
              {open ? (
                <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
                  {error && (
                    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>
                  )}
                  <Field id="full_name" label="Full name" error={errors.full_name}>
                    <input id="full_name" name="full_name" autoComplete="name" required className={inputClass}
                      value={values.full_name} onChange={(e) => setValue("full_name", e.target.value)}
                      aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? "full_name-error" : undefined} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="email" label="Email address" error={errors.email}>
                      <input id="email" name="email" type="email" autoComplete="email" required className={inputClass}
                        value={values.email} onChange={(e) => setValue("email", e.target.value)}
                        aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
                    </Field>
                    <Field id="phone" label="WhatsApp phone number" error={errors.phone} hint="Include your country code.">
                      <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="+234 801 234 5678" className={inputClass}
                        value={values.phone} onChange={(e) => setValue("phone", e.target.value)}
                        aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
                    </Field>
                  </div>
                  <Field id="cohort" label="Selected cohort">
                    <input id="cohort" value={c.title} readOnly className={inputClass + " bg-muted"} />
                  </Field>
                  <Field id="experience_level" label="Current experience level" error={errors.experience_level}>
                    <select id="experience_level" name="experience_level" required className={inputClass}
                      value={values.experience_level} onChange={(e) => setValue("experience_level", e.target.value)}
                      aria-invalid={!!errors.experience_level} aria-describedby={errors.experience_level ? "experience_level-error" : undefined}>
                      <option value="" disabled>Select your level</option>
                      {EXPERIENCE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>

                  {/* Honeypot: hidden from people and assistive technology, filled in by bots. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label htmlFor="website">Leave this field empty</label>
                    <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div>
                    <label className="flex items-start gap-3 text-sm">
                      <input type="checkbox" name="consent" className="mt-1 size-4 rounded border-input"
                        checked={values.consent} onChange={(e) => setValue("consent", e.target.checked)}
                        aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-error" : undefined} />
                      <span>
                        I agree to the{" "}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">privacy policy</a>{" "}
                        and consent to Corepoint Tech Academy contacting me about this cohort.
                      </span>
                    </label>
                    {errors.consent && <p id="consent-error" role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.consent}</p>}
                  </div>

                  <div className="space-y-3 border-t border-border pt-5">
                    <Button type="submit" variant="cta" size="xl" className="w-full">
                      Register &amp; Pay {formatNaira(price)}
                    </Button>
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      Secure payment powered by Paystack. Your enrolment will be confirmed after successful payment.
                    </p>
                  </div>
                </form>
              ) : (
                <Closed cohort={c} />
              )}

              <div className="mt-5 text-sm text-muted-foreground">
                Already registered but have not paid?{" "}
                <button type="button" onClick={() => setShowResume((s) => !s)} className="font-semibold text-primary">
                  Continue my registration
                </button>
              </div>
              {showResume && (
                <Resume
                  slug={c.slug}
                  onFound={async (tok) => {
                    try { localStorage.setItem(storageKey, tok); } catch { /* ignore */ }
                    setShowResume(false);
                    setError(null);
                    await showFromStatus(tok);
                  }}
                />
              )}
            </>
          )}
        </div>

        <Summary cohort={c} price={price} />
      </div>
    </div>
  );
}

function Summary({ cohort: c, price }: { cohort: CohortDetail; price: number | null }) {
  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tuition summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Programme</dt><dd className="text-right font-medium">{c.programme_name}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Cohort</dt><dd className="text-right font-medium">{c.title}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Duration</dt><dd className="font-medium">{c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Start date</dt><dd className="font-medium">{formatDate(c.start_date)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Pay by</dt><dd className="font-medium">{formatDate(c.payment_deadline ?? c.registration_deadline)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-border pt-3">
          <dt className="text-muted-foreground">{c.earlyBirdActive ? "Early-bird tuition" : "Total tuition"}</dt>
          <dd className="text-lg font-bold">{formatNaira(price)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Full payment is required to confirm your enrolment.
        {c.earlyBirdActive ? ` Early-bird price applies to registrations on or before ${formatDate(c.early_bird_deadline)}.` : ""}
      </p>
    </aside>
  );
}

function Closed({ cohort: c }: { cohort: CohortDetail }) {
  const text: Record<string, string> = {
    coming_soon: "Registration for this cohort has not opened yet.",
    closed: "Registration for this cohort is closed.",
    in_progress: "This cohort has already started.",
    completed: "This cohort has been completed.",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <h2 className="text-xl font-semibold">{text[c.status] ?? "Registration is not available."}</h2>
      <p className="mt-2 text-sm text-muted-foreground">You can view the details or look at other cohorts.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline"><Link to="/cohorts/$slug" params={{ slug: c.slug }}>Cohort Details</Link></Button>
        <Button asChild variant="cta"><Link to="/cohorts">View All Cohorts</Link></Button>
      </div>
    </div>
  );
}

function Resume({ slug, onFound }: { slug: string; onFound: (token: string) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setMsg(null);
        const { data, error } = await supabase.rpc("resume_cohort_registration" as never, {
          p_reference: String(f.get("reference") ?? ""),
          p_email: String(f.get("email") ?? ""),
        } as never);
        setBusy(false);
        const row = !error && Array.isArray(data) ? (data[0] as { pay_token: string; cohort_slug: string } | undefined) : undefined;
        if (!row) return setMsg("We could not find a registration with those details. Check the reference and the email you used.");
        if (row.cohort_slug !== slug) return setMsg("That registration is for a different cohort.");
        onFound(row.pay_token);
      }}
    >
      {msg && <p role="alert" className="text-sm font-medium text-destructive">{msg}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="resume_ref" label="Registration reference"><input id="resume_ref" name="reference" placeholder="CPT-XXXXXXXX" className={inputClass} /></Field>
        <Field id="resume_email" label="Email you registered with"><input id="resume_email" name="email" type="email" autoComplete="email" className={inputClass} /></Field>
      </div>
      <Button type="submit" variant="outline" disabled={busy}>{busy ? "Checking..." : "Continue"}</Button>
    </form>
  );
}

function Pending({
  status, cohort: c, bank, error, notice, onRetry, onStartOver,
}: {
  status: Status; cohort: CohortDetail; bank: Bank | null; error: string | null; notice: string | null;
  onRetry: () => void; onStartOver: () => void;
}) {
  const amount = formatNaira(Number(status.amount_due));
  const hasBank = bank?.bank_name && bank?.account_name && bank?.account_number;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold">Complete your payment, {status.full_name.split(" ")[0]}</h2>
        {error && <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        {notice && <p role="status" className="mt-3 rounded-md bg-secondary/60 p-3 text-sm font-medium">{notice}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          Your registration has been saved, but payment has not been confirmed. Complete your {amount} tuition payment to
          secure your seat.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration reference: <strong className="text-foreground">{status.registration_reference}</strong>. Keep it safe.
          You can return to this page at any time to finish.
        </p>
        <Button className="mt-5 w-full sm:w-auto" variant="cta" size="xl" onClick={onRetry}>
          Retry Payment ({amount})
        </Button>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Secure payment powered by Paystack. Your enrolment will be confirmed after successful payment.
        </p>
      </div>

      <details className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold">Prefer to pay by bank transfer?</summary>
        <div className="mt-4 space-y-4 text-sm">
          {hasBank ? (
            <dl className="space-y-2 rounded-xl border border-border p-4">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{bank!.bank_name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{bank!.account_name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account number</dt><dd className="font-medium">{bank!.account_number}</dd></div>
            </dl>
          ) : (
            <p className="text-muted-foreground">Contact admissions on +234 911 575 1406 for the account details.</p>
          )}
          <p className="text-muted-foreground">
            Use <strong>{status.registration_reference}</strong> as the payment narration, then submit your transfer details
            below. Your place is confirmed only after our team verifies the payment.
          </p>
          <BankTransferForm />
        </div>
      </details>

      <button type="button" onClick={onStartOver} className="text-sm font-semibold text-primary">
        Not you? Start a new registration
      </button>
      <p className="text-xs text-muted-foreground">Cohort: {c.title}</p>
    </div>
  );
}

function Success({ status, onStartOver }: { status: Status; onStartOver: () => void }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const paidDate = status.paid_at ? new Date(status.paid_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-800"><Check className="size-5" /></span>
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
        </div>
        <p className="mt-3 text-muted-foreground">
          Congratulations! Your payment has been confirmed, and your enrolment in Corepoint Tech Academy&apos;s {status.cohort_title} is successful.
        </p>
        <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
          <Row label="Student" value={status.full_name} />
          <Row label="Programme" value={status.programme_name} />
          <Row label="Cohort" value={status.cohort_title} />
          <Row label="Amount paid" value={formatNaira(Number(status.amount_due))} />
          <Row label="Payment reference" value={status.paid_reference ?? ""} />
          <Row label="Payment date" value={paidDate} />
          <Row label="Cohort start date" value={formatDate(status.start_date)} />
          <Row label="Enrolment status" value="Confirmed" />
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          Our team will send onboarding instructions to your registered email address.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setShowReceipt((s) => !s)}>
            <Printer className="size-4" /> {showReceipt ? "Hide receipt" : "View / Download Receipt"}
          </Button>
          <Button asChild variant="cta"><Link to="/cohorts">Browse other cohorts</Link></Button>
        </div>
      </div>

      {showReceipt && (
        <>
          <style>{`@media print { body * { visibility: hidden !important; } #receipt, #receipt * { visibility: visible !important; } #receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; } }`}</style>
          <div id="receipt" className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-xl font-bold">Payment Receipt</h3>
            <p className="text-sm text-muted-foreground">Corepoint Tech Academy</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Received from" value={status.full_name} />
              <Row label="Email" value={status.email} />
              <Row label="For" value={`${status.programme_name}, ${status.cohort_title}`} />
              <Row label="Amount" value={formatNaira(Number(status.amount_due))} />
              <Row label="Payment method" value={status.payment_channel ? `Paystack (${status.payment_channel})` : "Paystack"} />
              <Row label="Reference" value={status.paid_reference ?? ""} />
              <Row label="Registration reference" value={status.registration_reference} />
              <Row label="Date" value={paidDate} />
              <Row label="Status" value="Paid in full" />
            </dl>
            <Button className="mt-5 print:hidden" onClick={() => window.print()}>Print or save as PDF</Button>
          </div>
        </>
      )}

      <button type="button" onClick={onStartOver} className="text-sm font-semibold text-primary">Register someone else</button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

// The original bank-transfer flow, kept as a secondary option.
function BankTransferForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const amount = Number(v("amount"));
    if (!v("registration_reference") || !v("email")) return setError("Please enter your registration reference and email.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Please enter the amount you paid.");
    if (v("payment_reference").length < 3) return setError("Please enter your transfer reference or transaction details.");
    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc("submit_cohort_payment" as never, {
      p_registration_reference: v("registration_reference"),
      p_email: v("email"),
      p_amount: amount,
      p_payment_reference: v("payment_reference"),
      p_payment_date: v("payment_date") || null,
    } as never);
    setSubmitting(false);
    if (rpcError) return setError(friendlyError(rpcError as { code?: string; message?: string }));
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="rounded-xl bg-primary/10 p-4 font-medium text-primary">
        Transfer details submitted for verification. This is not a confirmation of payment until our team has verified it.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 font-medium text-destructive">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="bt_ref" label="Registration reference"><input id="bt_ref" name="registration_reference" placeholder="CPT-XXXXXXXX" className={inputClass} /></Field>
        <Field id="bt_email" label="Email used to register"><input id="bt_email" name="email" type="email" className={inputClass} /></Field>
        <Field id="bt_amount" label="Amount paid (NGN)"><input id="bt_amount" name="amount" type="number" inputMode="decimal" min="1" step="any" className={inputClass} /></Field>
        <Field id="bt_date" label="Payment date"><input id="bt_date" name="payment_date" type="date" max={today} className={inputClass} /></Field>
      </div>
      <Field id="bt_txn" label="Transfer reference or transaction details"><input id="bt_txn" name="payment_reference" maxLength={100} className={inputClass} /></Field>
      <Button type="submit" variant="outline" disabled={submitting}>{submitting ? "Submitting..." : "Submit transfer details"}</Button>
    </form>
  );
}
