import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // adjust this import to match your existing Supabase client path

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/admin/blog/new",
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/admin/login" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }

    navigate({ to: redirect });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="size-6 text-primary" />
        </div>

        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">
          Admin Login
        </h1>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to manage blog posts.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </div>

          <Button type="submit" size="lg" variant="cta" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
