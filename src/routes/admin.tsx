// Save as src/routes/admin.tsx
// Layout for every /admin page. The login page lives at /admin/login and is not guarded.
import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, Loader2, LogOut, Receipt, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";
import { AdminContext, atLeast, getAdminAccess, type AdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Corepoint Tech Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLogin = pathname === "/admin/login";
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLogin) return;
    let active = true;

    async function check() {
      const result = await getAdminAccess();
      if (!active) return;
      if (!result) {
        navigate({ to: "/admin/login", replace: true });
        return;
      }
      setAccess(result);
      setChecking(false);
    }
    check();

    // If the user signs out in another tab, leave the admin area immediately.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAccess(null);
        navigate({ to: "/admin/login", replace: true });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, navigate]);

  if (isLogin) return <Outlet />;

  if (checking || !access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Checking access">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <AdminContext.Provider value={access}>
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav aria-label="Admin" className="flex items-center gap-1">
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <LayoutDashboard className="size-4" /> Overview
            </Link>
            <Link
              to="/admin/leads"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <Users className="size-4" /> Leads
            </Link>
            {atLeast(access.role, "admin") && (
              <Link
                to="/admin/cohorts"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <GraduationCap className="size-4" /> Cohorts
              </Link>
            )}
            {atLeast(access.role, "admin") && (
              <Link
                to="/admin/cohort-payments"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Receipt className="size-4" /> Cohort Payments
              </Link>
            )}
            <Link
              to="/admin/payments"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <Wallet className="size-4" /> Payments
            </Link>
            {/* Analytics is added in a later phase. */}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {access.email} <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold">{access.role}</span>
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </AdminContext.Provider>
  );
}
