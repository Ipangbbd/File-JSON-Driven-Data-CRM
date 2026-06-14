import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/crm/AppShell";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useDataContext } from "@/lib/providers/DataProvider";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { status } = useAuth();
  const { ready } = useDataContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate({ to: "/login", search: { from: pathname } as never });
    }
  }, [status, navigate, pathname]);

  if (!ready || status === "initializing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="surface-card px-8 py-6 text-sm text-muted-foreground">
          Loading workspace…
        </div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
