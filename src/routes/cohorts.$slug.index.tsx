// Save as src/routes/cohorts.$slug.index.tsx  (replaces the previous version)
// Sales and SEO layout for a cohort. Most of the wording is edited in /admin/cohorts.
import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";
import { pageStructuredDataScript, scheduledCourseSchema } from "@/lib/structured-data";
import { sanitizeRichText } from "@/lib/rich-text";
import {
  FORMAT_LABEL,
  STATUS_LABEL,
  fetchCohortDetail,
  formatDate,
  formatNaira,
  lagosToday,
  type CohortDetail,
  type CohortStatus,
} from "@/lib/cohorts";

// WhatsApp number shown in the site footer, in international format without the plus sign.
const WHATSAPP_NUMBER = "2349115751406";

export const Route = createFileRoute("/cohorts/$slug/")({
  loader: async ({ params }) => {
    const result = await fetchCohortDetail(params.slug);
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const c = loaderData.cohort;
    const url = `${SITE_URL}/cohorts/${params.slug}`;
    const title = c.seo_title?.trim() || `${c.title} | Corepoint Tech Academy`;
    const desc = (
      c.seo_description?.trim() ||
      c.tagline?.trim() ||
      c.description?.trim() ||
      `${c.programme_name} cohort training from Corepoint Tech Academy. See dates, curriculum and tuition.`
    ).slice(0, 200);
    const price = c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee;

    // One structured-data script built from the site's shared helpers (organization, webpage,
    // breadcrumbs and the course with its scheduled instance). Only configured facts are included.
    const structured = pageStructuredDataScript({
      name: title,
      url,
      description: desc,
      image: c.image_url ?? undefined,
      breadcrumbs: [
        { name: "Home", url: SITE_URL },
        { name: "Cohorts", url: `${SITE_URL}/cohorts` },
        { name: c.title, url },
      ],
      entities: [
        scheduledCourseSchema({
          name: c.title,
          description: desc,
          url,
          image: c.image_url,
          courseMode:
            c.learning_format === "virtual" ? "Online" : c.learning_format === "physical" ? "Onsite" : ["Online", "Onsite"],
          startDate: c.start_date,
          endDate: c.end_date,
          price,
        }),
      ],
    });

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        ...(c.image_url ? [{ property: "og:image", content: c.image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [structured],
    };
  },
  notFoundComponent: CohortNotFound,
  component: CohortDetailPage,
});

const PAYMENT_LABEL: Record<string, string> = {
  full: "Full payment",
  instalment: "Instalment payment",
  installment: "Instalment payment",
};

// Shown when the admin has not written a custom "What is included" list.
const DEFAULT_INCLUDED = [
  "Live instructor-led sessions",
  "Practical assignments",
  "Real-world projects",
  "Learning resources",
  "Student support community",
  "Certificate of completion, subject to assessment requirements",
];

const statusStyles: Record<CohortStatus, string> = {
  open: "bg-primary text-white",
  coming_soon: "border border-[#d7d7d7] bg-white text-[#111111]",
  in_progress: "border border-[#d7d7d7] bg-white text-[#111111]",
  closed: "border border-[#d7d7d7] bg-white text-[#111111]",
  completed: "border border-[#d7d7d7] bg-white text-[#111111]",
};

const unavailableLabel: Record<Exclude<CohortStatus, "open">, string> = {
  coming_soon: "Registration opens soon",
  closed: "Registration closed",
  in_progress: "Cohort in progress",
  completed: "Cohort completed",
};

const whatsappLink = (title: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Corepoint Tech Academy, I have a question about ${title}.`)}`;

const paragraphs = (text: string | null) => (text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

// Days until a date, worked out in the browser so the page markup never differs between server and browser.
function useDaysLeft(deadline: string | null): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const diff = Math.round((Date.parse(deadline) - Date.parse(lagosToday())) / 86_400_000);
    setDays(diff);
  }, [deadline]);
  return days;
}

function CohortDetailPage() {
  const { cohort: c } = Route.useLoaderData();
  const open = c.status === "open";
  const price = c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee;
  const included = c.included.length > 0 ? c.included : DEFAULT_INCLUDED;

  return (
    // Bottom padding on small screens so the sticky bar never covers the footer.
    <div className="bg-white pb-24 text-[#111111] md:pb-0">
      <Hero c={c} open={open} />
      {open && <Urgency c={c} />}

      <div className="mx-auto max-w-6xl px-4">
        {c.description && (
          <section className="bg-white pb-2 pt-10" aria-label="Cohort description">
            <article
              className="rich-text-content cohort-description mx-auto max-w-5xl"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(c.description) }}
            />
          </section>
        )}

        {(c.audience.length > 0 || c.not_for.length > 0) && (
          <Section id="audience" title="Is this programme right for you?">
            <div className="grid gap-6 md:grid-cols-2">
              {c.audience.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold">This is for you if you are</h3>
                  <ul className="mt-4 space-y-3">
                    {c.audience.map((a) => (
                      <li key={a} className="flex items-start gap-3"><span>{a}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {c.not_for.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  {c.slug !== "data-analysis-cohort-1" && (
                    <h3 className="text-lg font-semibold">This may not be for you if</h3>
                  )}
                  <ul className="mt-4 space-y-3">
                    {c.not_for.map((a) => (
                      <li key={a} className="flex items-start gap-3">
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        <Section id="included" title="What is included">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {included.map((b) => (
                <li key={b} className="flex items-start gap-3"><span>{b}</span></li>
              ))}
            </ul>
          </div>
        </Section>

        <Tuition c={c} open={open} />

        {c.faqs.length > 0 && <Faqs faqs={c.faqs} />}

        <section className="pb-16">
          <div className="border-t border-[#ededed] px-2 py-12 text-center text-[#111111] sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {open ? `Reserve your place in ${c.title}` : "Interested in this programme?"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#444444]">
              {open
                ? `Registration closes on ${formatDate(c.payment_deadline ?? c.registration_deadline)}. ${c.seatsRemaining !== null ? `${c.seatsRemaining} seats remaining.` : ""}`
                : "Browse other cohorts, or ask us a question and our team will help."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {open ? (
                <RegisterButton slug={c.slug} size="xl" />
              ) : (
                <>
                  <Button disabled size="xl" variant="outline">{unavailableLabel[c.status as Exclude<CohortStatus, "open">]}</Button>
                  <Button asChild size="xl" variant="cta"><Link to="/cohorts">View Other Cohorts</Link></Button>
                </>
              )}
              <Button asChild size="xl" variant="outline">
                <a href={whatsappLink(c.title)} target="_blank" rel="noopener noreferrer">
                  Ask question
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Compact sticky bar, mobile only */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{c.programme_name}</p>
            <p className="text-sm text-muted-foreground">{formatNaira(price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={whatsappLink(c.title)} target="_blank" rel="noopener noreferrer" aria-label="Ask question on WhatsApp"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-primary">
              Ask
            </a>
            {open ? <RegisterButton slug={c.slug} /> : <Button disabled>{unavailableLabel[c.status as Exclude<CohortStatus, "open">]}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="py-10" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RegisterButton({ slug, size }: { slug: string; size?: "xl" }) {
  return (
    <Button asChild variant="cta" size={size}>
      <Link to="/cohorts/$slug/register" params={{ slug }}>Register Now</Link>
    </Button>
  );
}

function Hero({ c, open }: { c: CohortDetail; open: boolean }) {
  const lead = c.tagline?.trim();
  return (
    <section className="border-b border-[#ededed] bg-white text-[#111111]">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-[#444444]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-[#111111]">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/cohorts" className="hover:text-[#111111]">Cohorts</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#111111]">{c.title}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              {c.cohort_number != null && (
                <span className="rounded-full border border-[#d7d7d7] px-3 py-1 text-xs font-medium text-[#111111]">Cohort {c.cohort_number}</span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{c.title}</h1>
            {lead && <p className="mt-4 max-w-xl text-lg text-[#444444]">{lead}</p>}

            <dl className="mt-6 grid max-w-xl grid-cols-2 gap-4 text-sm">
              <HeroFact label="Start date">{formatDate(c.start_date)}</HeroFact>
              <HeroFact label="Duration">{c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}</HeroFact>
              <HeroFact label="Format">{FORMAT_LABEL[c.learning_format]}</HeroFact>
              <HeroFact label="Tuition">{formatNaira(c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee)}</HeroFact>
              {c.seatsRemaining !== null && (
                <HeroFact label="Seats left">{c.seatsRemaining}</HeroFact>
              )}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {open ? (
                <RegisterButton slug={c.slug} size="xl" />
              ) : (
                <Button disabled size="xl" variant="outline">{unavailableLabel[c.status as Exclude<CohortStatus, "open">]}</Button>
              )}
              <Button asChild size="xl" variant="outline">
                <a href={whatsappLink(c.title)} target="_blank" rel="noopener noreferrer">
                  Ask question
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-[#444444]">Secure online payment with Paystack</p>
          </div>

          {c.image_url ? (
            <img
              src={c.image_url}
              alt={`${c.programme_name} training at Corepoint Tech Academy`}
              width={1600}
              height={1008}
              decoding="async"
              className="w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="hidden aspect-[16/10] w-full rounded-3xl bg-[#f5f5f5] lg:block" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[#444444]">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

// A true deadline and true seat count, never invented urgency.
function Urgency({ c }: { c: CohortDetail }) {
  const deadline = c.payment_deadline ?? c.registration_deadline;
  const days = useDaysLeft(deadline);
  const parts: string[] = [];
  if (deadline) {
    parts.push(
      days === null ? `Register by ${formatDate(deadline)}`
      : days > 1 ? `Registration closes in ${days} days (${formatDate(deadline)})`
      : days === 1 ? `Registration closes tomorrow (${formatDate(deadline)})`
      : days === 0 ? `Registration closes today (${formatDate(deadline)})`
      : `Register by ${formatDate(deadline)}`,
    );
  }
  if (c.seatsRemaining !== null) parts.push(`${c.seatsRemaining} ${c.seatsRemaining === 1 ? "seat" : "seats"} remaining`);
  if (parts.length === 0) return null;
  return (
    <div className="border-b border-border bg-secondary/60">
      <p className="mx-auto max-w-6xl px-4 py-3 text-center text-sm font-semibold">{parts.join("  |  ")}</p>
    </div>
  );
}

function Tuition({ c, open }: { c: CohortDetail; open: boolean }) {
  const options = c.payment_options.map((o) => PAYMENT_LABEL[o] ?? o);
  return (
    <Section id="tuition" title="Tuition and payment">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <dl className="space-y-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Standard tuition</dt>
              <dd className="text-xl font-bold">{formatNaira(c.tuition_fee)}</dd>
            </div>
            {c.earlyBirdActive && (
              <div className="rounded-xl bg-primary/10 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-primary">Early-bird tuition</dt>
                  <dd className="text-xl font-bold text-primary">{formatNaira(c.early_bird_fee)}</dd>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Available to students who register on or before {formatDate(c.early_bird_deadline)}. The price is applied automatically when you register in time.
                </p>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Registration and payment deadline</dt>
              <dd className="font-medium">{formatDate(c.payment_deadline ?? c.registration_deadline)}</dd>
            </div>
            {c.class_schedule && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Class schedule</dt>
                <dd className="text-right font-medium">{c.class_schedule}</dd>
              </div>
            )}
          </dl>
          {open && (
            <div className="mt-5"><RegisterButton slug={c.slug} size="xl" /></div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">How payment works</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Fill in the short registration form.</li>
            <li>Pay the full tuition securely online with Paystack, on the same page.</li>
            <li>Your place is confirmed as soon as the payment is verified, and you receive a receipt.</li>
          </ol>
          {options.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Payment option: {options.join(", ")}.</p>}
          <p className="mt-3 text-sm text-muted-foreground">Prefer to pay by bank transfer? You can choose that after you register.</p>
        </div>
      </div>
    </Section>
  );
}

function Faqs({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <Section id="faq" title="Frequently asked questions">
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {faqs.map((f, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i}>
              <h3>
                <button type="button" onClick={() => setOpenIdx(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold hover:bg-secondary/40">
                  {f.q}
                </button>
              </h3>
              {isOpen && <p id={`faq-${i}`} className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function CohortNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Cohort not found</h1>
      <p className="mt-3 text-muted-foreground">
        This cohort may have been removed or is not available yet. See the cohorts that are currently published.
      </p>
      <Button asChild variant="cta" className="mt-6"><Link to="/cohorts">View All Cohorts</Link></Button>
    </div>
  );
}
