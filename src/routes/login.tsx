import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/providers/AuthProvider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — Northwind CRM" }],
  }),
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  { label: "Administrator", email: "admin@northwind.crm", password: "Admin!2025" },
  { label: "Manager", email: "manager@northwind.crm", password: "Manager!2025" },
  { label: "Support Agent", email: "agent@northwind.crm", password: "Agent!2025" },
  { label: "Viewer", email: "viewer@northwind.crm", password: "Viewer!2025" },
];

function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@northwind.crm");
  const [password, setPassword] = useState("Admin!2025");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/" });
  }, [status, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-foreground text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold">Northwind CRM</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            Run customer journeys with the focus of a great support team.
          </h1>
          <p className="max-w-md text-primary-foreground/70">
            Workflow-first case management, knowledge that follows your team and role-based
            access designed for enterprise operations.
          </p>
        </div>
        <div className="text-xs uppercase tracking-widest text-primary-foreground/50">
          v1.0 — Customer Operations
        </div>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use one of the seeded accounts below to explore each role.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full rounded-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 surface-panel p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Demo credentials
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-secondary"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    <span>
                      <span className="font-medium text-foreground">{account.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{account.email}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{account.password}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
