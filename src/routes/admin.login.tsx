// Save as src/routes/admin.login.tsx
// Sign-in only. There is deliberately no sign-up or "create account" option.
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// Adjust this import to match your existing Supabase client file.
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in | Corepoint Tech Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    if (Date.now() < lockedUntil) {
      setError("Too many attempts. Please wait a moment and try again.");
      return;
    }

    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Same message for every failure, so the form never reveals which emails exist.
      const next = failures + 1;
      setFailures(next);
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCK_MS);
        setFailures(0);
      }
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }

    // Signed in. Confirm this account actually holds an admin role.
    const access = await getAdminAccess();
    if (!access) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      setBusy(false);
      return;
    }

    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={onSubmit} noValidate className="w-full space-y-5 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div>
          <h1 className="text-2xl font-bold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Authorised Corepoint staff only.</p>
        </div>

        <div aria-live="polite">
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>

        <Button type="submit" variant="cta" className="w-full" disabled={busy}>
          {busy ? (<><Loader2 className="size-4 animate-spin" /> Signing in...</>) : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
