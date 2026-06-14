import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { activityService } from "@/lib/services/activity.service";
import { tasksService } from "@/lib/services/tasks.service";
import { formatDateTime, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Northwind CRM" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, permissions } = useAuth();
  const myTasks = useStore(() => (user ? tasksService.forAssignee(user.id) : []));
  const activity = useStore(() => activityService.recent(20));
  if (!user) return null;

  const open = myTasks.filter((t) => t.status !== "completed");
  const done = myTasks.length - open.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Your profile" description="Account details and access summary." />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card lg:col-span-1 flex flex-col items-center gap-3 p-6 text-center">
          <UserAvatar initials={user.initials} color={user.avatarColor} size="lg" />
          <div>
            <div className="text-lg font-semibold">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 pt-4 text-left text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="font-medium">{ROLE_LABELS[user.role]}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="truncate font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Open tasks</div>
              <div className="font-medium">{open.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-medium">{done}</div>
            </div>
          </div>
        </section>

        <section className="surface-card lg:col-span-2 p-6">
          <h3 className="text-base font-semibold">Permissions</h3>
          <p className="text-xs text-muted-foreground">Capabilities granted by your role.</p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {permissions.map((p) => (
              <li
                key={p}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-card p-6">
        <h3 className="text-base font-semibold">Recent activity</h3>
        <ul className="mt-4 divide-y divide-border">
          {activity.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
              <span>{entry.message}</span>
              <span
                className="text-xs text-muted-foreground"
                title={formatDateTime(entry.createdAt)}
              >
                {relativeTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
