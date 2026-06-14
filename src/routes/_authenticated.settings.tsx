import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useDataContext } from "@/lib/providers/DataProvider";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Northwind CRM" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { can } = useAuth();
  const { reset } = useDataContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!can("settings.write")) navigate({ to: "/" });
  }, [can, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace administration and data lifecycle controls."
      />
      <section className="surface-card p-6">
        <h3 className="text-base font-semibold">Demo data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Resetting restores the JSON seed data and clears any local mutations from this browser.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (confirm("Reset all CRM data to the original seed? This cannot be undone.")) {
                reset();
              }
            }}
          >
            Reset workspace to seed
          </Button>
        </div>
      </section>
    </div>
  );
}
