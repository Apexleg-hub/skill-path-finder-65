// Save as src/components/site/CohortsBanner.tsx
// A banner for the homepage that leads to /cohorts. It always shows. When a cohort is published
// it also highlights the next one; otherwise it falls back to a general message.
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABEL,
  fetchPublishedCohorts,
  formatDate,
  formatNaira,
  type CohortWithMeta,
} from "@/lib/cohorts";

export function CohortsBanner() {
  const [next, setNext] = useState<CohortWithMeta | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublishedCohorts()
      .then((all) => {
        if (!active) return;
        // The list is sorted with open cohorts first, then coming soon.
        setNext(all.find((c) => c.status === "open" || c.status === "coming_soon") ?? null);
      })
      .catch(() => active && setNext(null)); // on any failure the general banner stays
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10" aria-labelledby="cohorts-banner-heading">
      <div className="overflow-hidden rounded-3xl bg-hero-gradient text-primary-foreground shadow-lift">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium tracking-wide">
              <GraduationCap className="size-4" /> Cohort training
            </span>
            <h2 id="cohorts-banner-heading" className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              Learn with a group. Finish with real projects.
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/80">
              Structured, instructor-led programmes with fixed start dates, practical assignments and certificates of
              completion.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="xl">
                <Link to="/cohorts">
                  Explore Cohorts <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {next ? (
            <div className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur">
              <span className="inline-flex rounded-full bg-primary-foreground px-3 py-1 text-xs font-semibold text-primary">
                {STATUS_LABEL[next.status]}
              </span>
              <h3 className="mt-3 text-xl font-semibold">
                {next.programme_name}
                {next.cohort_number ? ` (Cohort ${next.cohort_number})` : ""}
              </h3>
              <dl className="mt-3 space-y-2 text-sm text-primary-foreground/85">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0" />
                  <dt className="sr-only">Start date</dt>
                  <dd>Starts {formatDate(next.start_date)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Tuition</dt>
                  <dd className="font-semibold">{formatNaira(next.tuition_fee)}</dd>
                </div>
              </dl>
              <Button asChild variant="onHero" className="mt-5 w-full sm:w-auto">
                <Link to="/cohorts/$slug" params={{ slug: next.slug }}>
                  View Details
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold">What is a cohort?</h3>
              <ul className="mt-3 space-y-2 text-sm text-primary-foreground/85">
                <li>A fixed start date and schedule</li>
                <li>Live sessions with an instructor</li>
                <li>Projects you can add to your portfolio</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
