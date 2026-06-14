import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Eye } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { TaskStatusBadge } from "@/components/crm/StatusBadges";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { journeysService } from "@/lib/services/journeys.service";
import { tasksService } from "@/lib/services/tasks.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";
import type { TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Northwind CRM" }] }),
  component: TasksPage,
});

const FILTERS: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];

function TasksPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/tasks";
  const { user, can } = useAuth();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const tasks = useStore(() => tasksService.list());
  const users = useStore(() => usersService.list());
  const journeys = useStore(() => journeysService.list());

  const userById = new Map(users.map((u) => [u.id, u]));
  const journeyById = new Map(journeys.map((j) => [j.id, j]));

  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Work assigned across every customer journey."
        actions={
          <Link to="/tasks/new">
            <Button className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> New task
            </Button>
          </Link>
        }
        meta={
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.key ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {isRoot && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Journey</th>
                <th className="px-6 py-3 font-medium">Assignee</th>
                <th className="px-6 py-3 font-medium">Due</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => {
                const assignee = task.assigneeId ? userById.get(task.assigneeId) : null;
                const journey = journeyById.get(task.journeyId);
                const canComplete = can("tasks.complete") && user && task.status !== "completed";
                return (
                  <tr key={task.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">
                      <Link to={`/tasks/${task.id}`} className="hover:underline text-foreground">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      {journey ? (
                        <Link to={`/journeys/${journey.id}`} className="text-primary font-mono text-xs hover:underline">
                          {journey.reference}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar initials={assignee.initials} color={assignee.avatarColor} size="xs" />
                          <span className="text-muted-foreground text-xs">
                            {assignee.firstName} {assignee.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{formatDate(task.dueDate)}</td>
                    <td className="px-6 py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                      {canComplete && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="rounded-full text-xs h-7 px-2.5"
                          onClick={() => {
                            try {
                              tasksService.updateStatus(task.id, "completed", user!.id);
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Unable to update task");
                            }
                          }}
                        >
                          Complete
                        </Button>
                      )}
                      <Link to={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Outlet />
    </div>
  );
}
