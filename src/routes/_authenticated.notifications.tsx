import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/providers/DataProvider";
import { notificationsService } from "@/lib/services/notifications.service";
import { useAuth } from "@/lib/providers/AuthProvider";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Northwind CRM" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const notifications = useStore(() => (user ? notificationsService.forUser(user.id) : []));

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Recent workspace notifications." />
      <section className="surface-card p-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => notificationsService.markAllRead(user.id)} className="rounded-full">Mark all read</Button>
        </div>
        <ul className="mt-4 space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-lg border border-border p-3">
              <div className="font-medium">{n.title}</div>
              <div className="text-sm text-muted-foreground">{n.body}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
