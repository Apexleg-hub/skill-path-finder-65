// Save as src/routes/cohorts.$slug.register.tsx
import { useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Check, Copy, Loader2 } from "lucide-react";
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
      // Registration pages should not appear in search results.
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

const PAYMENT_LABEL: Record<string, string> = {
  full: "Full payment",
  instalment: "Instalment payment",
  installment: "Instalment payment",
};

const EXPERIENCE = [
  { value: "beginner", label: "Beginner (new to this field)" },
  { value: "intermediate", label: "Intermediate (some experience)" },
  { value: "advanced", label: "Advanced (working in this field)" },
];

type RegistrationResult = {
  registration_reference: string;
  amount_due: number;
  early_bird_applied: boolean;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
};

// Turns database errors into messages a student can act on.
function friendlyError(err: { code?: string; message?: string } | null): string {
  if (!err) return "Something went wrong. Please try again.";
  if (err.code === "P0001" && err.message) return err.message;
  if (err.code === "23505") return "This email is already registered for this cohort.";
  return "We could not complete your request. Please check your connection and try again.";
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterPage() {
  const c = Route.useLoaderData();
  const [mode, setMode] = useState<"register" | "pay">("register");
  const [result, setResult] = useState<{ data: RegistrationResult; email: string } | null>(null);

  const open = c.status === "open";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
      <Link
        to="/cohorts/$slug"
        params={{ slug: c.slug }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to cohort details
      </Link>

      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Register for {c.title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {result ? (
            <Confirmation cohort={c} result={result.data} email={result.email} />
          ) : mode === "pay" ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-xl font-semibold">Submit your payment details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Already registered? Enter your registration reference and the email you used to register.
              </p>
              <div className="mt-5">
                <PaymentForm askForIdentity />
              </div>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="mt-5 text-sm font-semibold text-primary"
              >
                Back to registration
              </button>
            </div>
          ) : open ? (
            <>
              <RegistrationForm cohort={c} onDone={(data, email) => setResult({ data, email })} />
              <p className="mt-5 text-sm text-muted-foreground">
                Already registered?{" "}
                <button type="button" onClick={() => setMode("pay")} className="font-semibold text-primary">
                  Submit your payment details
                </button>
              </p>
            </>
          ) : (
            <Closed cohort={c} />
          )}
        </div>

        <Summary cohort={c} />
      </div>
    </div>
  );
}

function Summary({ cohort: c }: { cohort: CohortDetail }) {
  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your cohort</h2>
      <p className="mt-2 text-lg font-semibold">
        {c.programme_name}
        {c.cohort_number != null ? ` (Cohort ${c.cohort_number})` : ""}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Starts</dt>
          <dd className="font-medium">{formatDate(c.start_date)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Register by</dt>
          <dd className="font-medium">{formatDate(c.registration_deadline)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-3">
          <dt className="text-muted-foreground">{c.earlyBirdActive ? "Early-bird tuition" : "Tuition"}</dt>
          <dd className="text-lg font-bold">{formatNaira(c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee)}</dd>
        </div>
      </dl>
      {c.earlyBirdActive && (
        <p className="mt-3 text-xs text-muted-foreground">
          Early-bird price applies to registrations made on or before {formatDate(c.early_bird_deadline)}.
        </p>
      )}
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
        <Button asChild variant="outline">
          <Link to="/cohorts/$slug" params={{ slug: c.slug }}>
            Cohort Details
          </Link>
        </Button>
        <Button asChild variant="cta">
          <Link to="/cohorts">View All Cohorts</Link>
        </Button>
      </div>
    </div>
  );
}

function RegistrationForm({
  cohort: c,
  onDone,
}: {
  cohort: CohortDetail;
  onDone: (data: RegistrationResult, email: string) => void;
}) {
  const openedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [goalLength, setGoalLength] = useState(0);
  const needsPaymentOption = c.payment_options.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const next: Record<string, string> = {};

    if (v("full_name").length < 2) next.full_name = "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("email"))) next.email = "Please enter a valid email address.";
    if (!/^\+?[0-9\s-]{7,20}$/.test(v("phone"))) next.phone = "Enter a valid WhatsApp number, for example +234 801 234 5678.";
    if (!v("experience_level")) next.experience_level = "Please select your experience level.";
    if (v("learning_goal").length < 10) next.learning_goal = "Please tell us a little about why you want to join (at least 10 characters).";
    if (needsPaymentOption && !v("payment_option")) next.payment_option = "Please choose a payment option.";
    if (!f.get("consent")) next.consent = "You must accept the privacy policy to register.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.getElementById("form-errors")?.focus();
      return;
    }

    // Light bot check: a form submitted within two seconds of opening is almost certainly automated.
    if (Date.now() - openedAt.current < 2000) {
      setFormError("Please review your details and try again.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc(
      "register_for_cohort" as never,
      {
        p_slug: c.slug,
        p_full_name: v("full_name"),
        p_email: v("email"),
        p_phone: v("phone"),
        p_experience_level: v("experience_level"),
        p_learning_goal: v("learning_goal"),
        p_payment_option: v("payment_option") || null,
        p_consent: true,
        p_website: v("website"), // honeypot, must stay empty
      } as never,
    );
    setSubmitting(false);

    const row = Array.isArray(data) ? (data[0] as RegistrationResult | undefined) : undefined;
    if (error || !row) {
      setFormError(friendlyError(error as { code?: string; message?: string } | null));
      document.getElementById("form-errors")?.focus();
      return;
    }
    onDone(row, v("email"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const errorList = Object.values(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div id="form-errors" tabIndex={-1} aria-live="polite" className="outline-none">
        {formError && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {formError}
          </p>
        )}
        {errorList.length > 0 && !formError && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            Please fix the highlighted fields below.
          </p>
        )}
      </div>

      <Field id="full_name" label="Full name" error={errors.full_name}>
        <input id="full_name" name="full_name" autoComplete="name" required aria-invalid={!!errors.full_name}
          aria-describedby={errors.full_name ? "full_name-error" : undefined} className={inputClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="email" label="Email address" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined} className={inputClass} />
        </Field>
        <Field id="phone" label="WhatsApp phone number" error={errors.phone} hint="Include your country code.">
          <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="+234 801 234 5678"
            aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} className={inputClass} />
        </Field>
      </div>

      <Field id="cohort" label="Selected cohort">
        <input id="cohort" value={c.title} readOnly className={inputClass + " bg-muted"} />
      </Field>

      <div className={needsPaymentOption ? "grid gap-5 sm:grid-cols-2" : ""}>
        <Field id="experience_level" label="Current experience level" error={errors.experience_level}>
          <select id="experience_level" name="experience_level" defaultValue="" required
            aria-invalid={!!errors.experience_level}
            aria-describedby={errors.experience_level ? "experience_level-error" : undefined} className={inputClass}>
            <option value="" disabled>Select your level</option>
            {EXPERIENCE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {needsPaymentOption && (
          <Field id="payment_option" label="Preferred payment option" error={errors.payment_option}>
            <select id="payment_option" name="payment_option" defaultValue="" required
              aria-invalid={!!errors.payment_option}
              aria-describedby={errors.payment_option ? "payment_option-error" : undefined} className={inputClass}>
              <option value="" disabled>Select an option</option>
              {c.payment_options.map((o) => (
                <option key={o} value={o}>{PAYMENT_LABEL[o] ?? o}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field id="learning_goal" label="Why do you want to join this programme?" error={errors.learning_goal}
        hint={`${goalLength}/1000`}>
        <textarea id="learning_goal" name="learning_goal" rows={4} maxLength={1000} required
          onChange={(e) => setGoalLength(e.target.value.length)} aria-invalid={!!errors.learning_goal}
          aria-describedby={errors.learning_goal ? "learning_goal-error" : undefined} className={inputClass} />
      </Field>

      {/* Honeypot: hidden from people and assistive technology, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined} className="mt-1 size-4 rounded border-input" />
          <span>
            I agree to the{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
              privacy policy
            </a>{" "}
            and consent to Corepoint Tech Academy contacting me about this cohort.
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.consent}</p>
        )}
      </div>

      <Button type="submit" variant="cta" size="xl" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (<><Loader2 className="size-4 animate-spin" /> Submitting...</>) : "Submit Registration"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Registering does not confirm your place. Your place is confirmed after your payment is verified.
      </p>
    </form>
  );
}

function Confirmation({
  cohort: c,
  result: r,
  email,
}: {
  cohort: CohortDetail;
  result: RegistrationResult;
  email: string;
}) {
  const [copied, setCopied] = useState(false);
  const hasBank = r.bank_name && r.account_name && r.account_number;

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(r.registration_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the reference is visible on screen */
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Registration received</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for registering for {c.programme_name}. Your place is not confirmed until payment is verified.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registration reference</p>
            <p className="mt-0.5 text-xl font-bold tracking-wider">{r.registration_reference}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyRef}>
            {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy</>}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Keep this reference. You will need it to submit your payment details.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Next step: make your payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Amount due:{" "}
          <span className="font-bold text-foreground">{formatNaira(r.amount_due)}</span>
          {r.early_bird_applied && " (early-bird price applied)"}
        </p>

        {hasBank ? (
          <dl className="mt-4 space-y-2 rounded-xl border border-border p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{r.bank_name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{r.account_name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account number</dt><dd className="font-medium">{r.account_number}</dd></div>
          </dl>
        ) : (
          <p className="mt-4 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            Our admissions team will send you the payment details shortly.
          </p>
        )}
        {r.instructions && <p className="mt-3 text-sm text-muted-foreground">{r.instructions}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          Use your registration reference as the payment narration, then submit your payment details below. Our team
          will verify the payment and confirm your enrolment.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Already paid? Submit your payment details</h2>
        <div className="mt-4">
          <PaymentForm reference={r.registration_reference} email={email} defaultAmount={r.amount_due} />
        </div>
      </div>

      <Button asChild variant="outline">
        <Link to="/cohorts">Browse other cohorts</Link>
      </Button>
    </div>
  );
}

function PaymentForm({
  reference,
  email,
  defaultAmount,
  askForIdentity = false,
}: {
  reference?: string;
  email?: string;
  defaultAmount?: number;
  askForIdentity?: boolean;
}) {
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

    const ref = askForIdentity ? v("registration_reference") : reference ?? "";
    const mail = askForIdentity ? v("email") : email ?? "";
    const amount = Number(v("amount"));

    if (!ref || !mail) return setError("Please enter your registration reference and email.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Please enter the amount you paid.");
    if (v("payment_reference").length < 3) return setError("Please enter your payment reference or transaction details.");

    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc(
      "submit_cohort_payment" as never,
      {
        p_registration_reference: ref,
        p_email: mail,
        p_amount: amount,
        p_payment_reference: v("payment_reference"),
        p_payment_date: v("payment_date") || null,
      } as never,
    );
    setSubmitting(false);

    if (rpcError) return setError(friendlyError(rpcError as { code?: string; message?: string }));
    setDone(true);
  }

  if (done) {
    return (
      <div role="status" className="rounded-xl bg-primary/10 p-4 text-sm">
        <p className="font-semibold text-primary">Payment details submitted for verification</p>
        <p className="mt-1 text-muted-foreground">
          Our team will check your payment and update your status. This is not a confirmation of payment or enrolment
          until it has been verified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {askForIdentity && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pay_ref" label="Registration reference">
            <input id="pay_ref" name="registration_reference" placeholder="CPT-XXXXXXXX" className={inputClass} />
          </Field>
          <Field id="pay_email" label="Email used to register">
            <input id="pay_email" name="email" type="email" autoComplete="email" className={inputClass} />
          </Field>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pay_amount" label="Amount paid (NGN)">
          <input id="pay_amount" name="amount" type="number" inputMode="decimal" min="1" step="any"
            defaultValue={defaultAmount} className={inputClass} />
        </Field>
        <Field id="pay_date" label="Payment date">
          <input id="pay_date" name="payment_date" type="date" max={today} className={inputClass} />
        </Field>
      </div>
      <Field id="pay_txn" label="Payment reference or transaction details" hint="For example the transfer reference or depositor name on your receipt.">
        <input id="pay_txn" name="payment_reference" maxLength={100} className={inputClass} />
      </Field>
      <Button type="submit" variant="cta" disabled={submitting}>
        {submitting ? (<><Loader2 className="size-4 animate-spin" /> Submitting...</>) : "Submit Payment Details"}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" /> Submitting details does not mark your payment as received.
      </p>
    </form>
  );
}
