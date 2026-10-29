// Save as src/routes/cohorts.$slug.index.tsx
// Leaves room for src/routes/cohorts.$slug.register.tsx (the registration page).
import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Check, ChevronDown, Clock, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FORMAT_LABEL,
  STATUS_LABEL,
  fetchCohortDetail,
  formatDate,
  formatNaira,
  type CohortDetail,
  type CohortStatus,
  type CurriculumModule,
} from "@/lib/cohorts";

const SITE = "https://corepointtech.com.ng";

export const Route = createFileRoute("/cohorts/$slug/")({
  loader: async ({ params }) => {
    const result = await fetchCohortDetail(params.slug);
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const c = loaderData.cohort;
    const url = `${SITE}/cohorts/${params.slug}`;
    const title = `${c.title} | Corepoint Tech Academy`;
    const desc =
      c.description?.slice(0, 160) ??
      `${c.programme_name} cohort training from Corepoint Tech Academy. See dates, curriculum and tuition.`;

    // Structured data uses only configured facts: no ratings, no invented prices or dates.
    const course: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: desc,
      provider: { "@type": "Organization", name: "Corepoint Tech Academy", url: SITE },
      url,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode:
          c.learning_format === "virtual" ? "Online" : c.learning_format === "physical" ? "Onsite" : ["Online", "Onsite"],
        ...(c.start_date ? { startDate: c.start_date } : {}),
        ...(c.end_date ? { endDate: c.end_date } : {}),
      },
      ...(c.tuition_fee != null
        ? { offers: { "@type": "Offer", price: c.tuition_fee, priceCurrency: "NGN", url } }
        : {}),
    };

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
      scripts: [{ type: "application/ld+json", children: JSON.stringify(course).replace(/</g, "\\u003c") }],
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

const BENEFITS = [
  "Live instructor-led sessions",
  "Practical assignments",
  "Real-world projects",
  "Learning resources",
  "Student support community",
  "Certificate of completion, subject to assessment requirements",
];

const statusStyles: Record<CohortStatus, string> = {
  open: "bg-primary-foreground text-primary",
  coming_soon: "bg-primary-foreground/20 text-primary-foreground",
  in_progress: "bg-primary-foreground/20 text-primary-foreground",
  closed: "bg-primary-foreground/20 text-primary-foreground",
  completed: "bg-primary-foreground/20 text-primary-foreground",
};

const unavailableLabel: Record<Exclude<CohortStatus, "open">, string> = {
  coming_soon: "Registration opens soon",
  closed: "Registration closed",
  in_progress: "Cohort in progress",
  completed: "Cohort completed",
};

function CohortDetailPage() {
  const { cohort: c, curriculum } = Route.useLoaderData();
  const open = c.status === "open";
  const price = c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee;

  return (
    // Bottom padding on small screens so the sticky bar never covers the footer.
    <div className="pb-24 md:pb-0">
      <Hero c={c} open={open} />

      <div className="mx-auto max-w-6xl px-4">
        {c.about && (
          <section className="py-12" aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-2xl font-bold sm:text-3xl">
              About the Programme
            </h2>
            <div className="mt-4 max-w-3xl space-y-4 text-muted-foreground">
              {c.about.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {c.skills.length > 0 && (
          <section className="pb-12" aria-labelledby="learn-heading">
            <h2 id="learn-heading" className="text-2xl font-bold sm:text-3xl">
              What You Will Learn
            </h2>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {c.skills.map((s) => (
                  <li key={s} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-4" />
                    </span>
                    <span className="font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {curriculum.length > 0 && <Curriculum modules={curriculum} />}

        <section className="pb-12" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="text-2xl font-bold sm:text-3xl">
            Programme Benefits
          </h2>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-4" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Tuition c={c} />

        {c.faqs.length > 0 && <Faqs faqs={c.faqs} />}

        <section className="pb-16">
          <div className="overflow-hidden rounded-3xl bg-hero-gradient px-6 py-12 text-center text-primary-foreground sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {open ? "Ready to join this cohort?" : "Interested in this programme?"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              {open
                ? `Register by ${formatDate(c.registration_deadline)} to secure your place.`
                : "Browse other cohorts, or register your interest and our admissions team will contact you."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {open ? (
                <RegisterButton slug={c.slug} size="xl" />
              ) : (
                <>
                  <Button disabled size="xl" variant="onHero">
                    {unavailableLabel[c.status as Exclude<CohortStatus, "open">]}
                  </Button>
                  <Button asChild size="xl" variant="cta">
                    <Link to="/cohorts">View Other Cohorts</Link>
                  </Button>
                </>
              )}
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
          {open ? (
            <RegisterButton slug={c.slug} />
          ) : (
            <Button disabled>{unavailableLabel[c.status as Exclude<CohortStatus, "open">]}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterButton({ slug, size }: { slug: string; size?: "xl" }) {
  return (
    <Button asChild variant="cta" size={size}>
      <Link to="/cohorts/$slug/register" params={{ slug }}>
        Register Now
      </Link>
    </Button>
  );
}

function Hero({ c, open }: { c: CohortDetail; open: boolean }) {
  return (
    <section className="bg-hero-gradient text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
        <Link
          to="/cohorts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
        >
          <ArrowLeft className="size-4" /> All cohorts
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
              {c.cohort_number != null && (
                <span className="rounded-full border border-primary-foreground/25 px-3 py-1 text-xs font-medium">
                  Cohort {c.cohort_number}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{c.title}</h1>
            {c.description && <p className="mt-4 max-w-xl text-lg text-primary-foreground/80">{c.description}</p>}

            <dl className="mt-6 grid max-w-xl grid-cols-2 gap-4 text-sm">
              <HeroFact icon={<CalendarDays className="size-4" />} label="Start date">
                {formatDate(c.start_date)}
              </HeroFact>
              <HeroFact icon={<Clock className="size-4" />} label="Duration">
                {c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}
              </HeroFact>
              <HeroFact icon={<MapPin className="size-4" />} label="Format">
                {FORMAT_LABEL[c.learning_format]}
              </HeroFact>
              <HeroFact icon={<Wallet className="size-4" />} label="Tuition">
                {formatNaira(c.earlyBirdActive ? c.early_bird_fee : c.tuition_fee)}
              </HeroFact>
              {c.seatsRemaining !== null && (
                <HeroFact icon={<Users className="size-4" />} label="Seats left">
                  {c.seatsRemaining}
                </HeroFact>
              )}
            </dl>

            <div className="mt-8">
              {open ? (
                <RegisterButton slug={c.slug} size="xl" />
              ) : (
                <Button disabled size="xl" variant="onHero">
                  {unavailableLabel[c.status as Exclude<CohortStatus, "open">]}
                </Button>
              )}
            </div>
          </div>

          {c.image_url ? (
            <img
              src={c.image_url}
              alt={`${c.programme_name} training`}
              width={1600}
              height={1008}
              className="w-full rounded-3xl object-cover shadow-lift"
            />
          ) : (
            <div className="hidden aspect-[16/10] w-full rounded-3xl bg-primary-foreground/10 lg:block" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroFact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-primary-foreground/70">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

function Curriculum({ modules }: { modules: CurriculumModule[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([modules[0]?.id]));
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="pb-12" aria-labelledby="curriculum-heading">
      <h2 id="curriculum-heading" className="text-2xl font-bold sm:text-3xl">
        Course Curriculum
      </h2>
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {modules.map((m) => {
          const isOpen = openIds.has(m.id);
          const panelId = `module-${m.id}`;
          return (
            <div key={m.id}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/40"
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-primary">
                      Week {m.week_number}
                    </span>
                    <span className="mt-0.5 block font-semibold">{m.module_title}</span>
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              {isOpen && (
                <div id={panelId} className="space-y-4 px-5 pb-5 text-sm">
                  {m.module_description && <p className="text-muted-foreground">{m.module_description}</p>}
                  {m.topics.length > 0 && <BulletBlock title="Topics covered" items={m.topics} />}
                  {m.objectives.length > 0 && <BulletBlock title="Learning objectives" items={m.objectives} />}
                  {m.assignment && (
                    <div>
                      <p className="font-semibold">Practical assignment</p>
                      <p className="mt-1 text-muted-foreground">{m.assignment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Tuition({ c }: { c: CohortDetail }) {
  const options = c.payment_options.map((o) => PAYMENT_LABEL[o] ?? o);
  return (
    <section className="pb-12" aria-labelledby="tuition-heading">
      <h2 id="tuition-heading" className="text-2xl font-bold sm:text-3xl">
        Tuition and Payment
      </h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                  Available to students who register on or before {formatDate(c.early_bird_deadline)}. The price is
                  applied automatically when you register in time.
                </p>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Registration deadline</dt>
              <dd className="font-medium">{formatDate(c.registration_deadline)}</dd>
            </div>
            {c.class_schedule && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Class schedule</dt>
                <dd className="text-right font-medium">{c.class_schedule}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Payment options</h3>
          {options.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {options.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Tuition is paid in full online with Paystack when you register. Your place is confirmed as soon as the
            payment is verified. Bank transfer is available as an alternative.
          </p>
        </div>
      </div>
    </section>
  );
}

function Faqs({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="pb-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold sm:text-3xl">
        Frequently Asked Questions
      </h2>
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {faqs.map((f, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold hover:bg-secondary/40"
                >
                  {f.q}
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              {isOpen && (
                <p id={`faq-${i}`} className="px-5 pb-5 text-sm text-muted-foreground">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CohortNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Cohort not found</h1>
      <p className="mt-3 text-muted-foreground">
        This cohort may have been removed or is not available yet. See the cohorts that are currently published.
      </p>
      <Button asChild variant="cta" className="mt-6">
        <Link to="/cohorts">View All Cohorts</Link>
      </Button>
    </div>
  );
}
