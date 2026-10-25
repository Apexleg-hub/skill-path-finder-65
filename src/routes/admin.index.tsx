// Save as src/routes/admin.index.tsx (replaces the Phase 1 version)
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";
import { atLeast, useAdmin } from "@/lib/admin-access";
import { formatNaira } from "@/lib/cohorts";
import { fetchLeadStats, leadError, type LeadStats } from "@/lib/leads";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

type Metrics = {
  published_cohorts: number;
  open_cohorts: number;
  total_registrations: number;
  verified_paid_students: number;
  outstanding_amount: number;
  verified_revenue: number;
};

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function AdminOverview() {
  const admin = useAdmin();
  const isStaff = atLeast(admin.role, "staff");
  const isAdmin = atLeast(admin.role, "admin");

  const [leads, setLeads] = useState<LeadStats | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff) return;
    let active = true;
    fetchLeadStats()
      .then((s) => active && setLeads(s))
      .catch((e) => active && setLeadsError(leadError(e)));
    return () => {
      active = false;
    };
  }, [isStaff]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    supabase.rpc("cohort_admin_metrics" as never).then(({ data, error }) => {
      if (!active) return;
      const row = Array.isArray(data) ? (data[0] as Metrics | undefined) : undefined;
      if (error || !row) setMetricsError("Could not load cohort metrics.");
      else setMetrics(row);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {admin.email} with the <strong>{admin.role}</strong> role.
      </p>

      {!isStaff && (
        <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Your role can sign in, but figures are limited to staff, admins and owners.
        </p>
      )}

      {isStaff && (
        <section className="mt-8" aria-labelledby="leads-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="leads-heading" className="text-lg font-semibold">Applications and leads</h2>
            <Link to="/admin/leads" className="text-sm font-semibold text-primary">Open leads</Link>
          </div>
          {!leads && !leadsError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          )}
          {leadsError && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{leadsError}</p>}
          {leads && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card label="Total applications" value={String(leads.total)} />
              <Card label="New and unreviewed" value={String(leads.unreviewed)} />
              <Card label="Contacted" value={String(leads.contacted)} />
              <Card label="Follow-ups due" value={String(leads.followUpsDue)} />
              <Card label="Enrolled" value={String(leads.enrolled)} />
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="mt-10" aria-labelledby="cohorts-heading">
          <h2 id="cohorts-heading" className="text-lg font-semibold">Cohorts</h2>
          {!metrics && !metricsError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          )}
          {metricsError && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{metricsError}</p>}
          {metrics && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card label="Published cohorts" value={String(metrics.published_cohorts)} />
              <Card label="Open cohorts" value={String(metrics.open_cohorts)} />
              <Card label="Cohort registrations" value={String(metrics.total_registrations)} />
              <Card label="Verified paid students" value={String(metrics.verified_paid_students)} />
              <Card label="Outstanding payments" value={formatNaira(Number(metrics.outstanding_amount))} />
              <Card label="Verified revenue" value={formatNaira(Number(metrics.verified_revenue))} />
            </div>
          )}
        </section>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Cohort management, payments and analytics charts are added in the next phases.
      </p>
    </div>
  );
}
