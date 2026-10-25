// Save as src/components/site/UpcomingCohorts.tsx
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABEL,
  fetchPublishedCohorts,
  formatDate,
  formatNaira,
  type CohortWithMeta,
} from "@/lib/cohorts";

export function UpcomingCohorts() {
  const [cohorts, setCohorts] = useState<CohortWithMeta[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublishedCohorts()
      .then((all) => {
        if (!active) return;
        // Already sorted: open first, then coming soon.
        setCohorts(all.filter((c) => c.status === "open" || c.status === "coming_soon").slice(0, 3));
      })
      .catch(() => active && setCohorts([]));
    return () => {
      active = false;
    };
  }, []);

  // Nothing published, still loading, or failed: render nothing so the homepage is undisturbed.
  if (!cohorts || cohorts.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Upcoming Training Cohorts</h2>
          <p className="mt-2 text-muted-foreground">Structured, instructor-led programmes with fixed start dates.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/cohorts">
            View All Cohorts <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cohorts.map((c) => (
          <article key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
            <span
              className={
                "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold " +
                (c.status === "open" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground")
              }
            >
              {STATUS_LABEL[c.status]}
            </span>
            <h3 className="mt-4 text-lg font-semibold">
              {c.programme_name}
              {c.cohort_number ? ` (Cohort ${c.cohort_number})` : ""}
            </h3>
            <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between gap-4">
                <dt>Start date</dt>
                <dd className="font-medium text-foreground">{formatDate(c.start_date)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Duration</dt>
                <dd className="font-medium text-foreground">
                  {c.duration_weeks ? `${c.duration_weeks} weeks` : "To be confirmed"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Tuition</dt>
                <dd className="font-medium text-foreground">{formatNaira(c.tuition_fee)}</dd>
              </div>
            </dl>
            <Button asChild variant="cta" className="mt-6">
              <Link to="/cohorts/$slug" params={{ slug: c.slug }}>
                View Details
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
