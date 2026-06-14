import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Save, Trash2, X, Plus } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { TaskStatusBadge } from "@/components/crm/StatusBadges";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { journeysService } from "@/lib/services/journeys.service";
import { tasksService } from "@/lib/services/tasks.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tasks/$id")({
  head: () => ({ meta: [{ title: `Task Details — Northwind CRM` }] }),
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const task = useStore(() => tasksService.byId(id));
  const allTasks = useStore(() => tasksService.list());
  const users = useStore(() => usersService.list());
  const journeys = useStore(() => journeysService.list());

  const activeUsers = users.filter((u) => u.status === "active");
  const userById = new Map(users.map((u) => [u.id, u]));
  const journeyById = new Map(journeys.map((j) => [j.id, j]));
  const taskById = new Map(allTasks.map((t) => [t.id, t]));

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<any>("pending");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="surface-card p-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Task not found</h2>
        <Button onClick={() => navigate({ to: "/tasks" })} className="rounded-full">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Tasks
        </Button>
      </div>
    );
  }

  const startEdit = () => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setAssigneeId(task.assigneeId ?? "none");
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setDependsOn(task.dependsOn);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    setError(null);
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      // Complete dependsOn blocker logic check before updating
      if (status === "completed" && dependsOn.length > 0) {
        const blockers = dependsOn
          .map((depId) => taskById.get(depId))
          .filter((dep) => dep && dep.status !== "completed");
        if (blockers.length > 0) {
          setError(`Cannot complete task: depends on ${blockers.length} incomplete tasks.`);
          return;
        }
      }

      tasksService.update(task.id, {
        title,
        description,
        status,
        assigneeId: assigneeId === "none" ? null : assigneeId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        dependsOn,
      });

      // Log status transition changes in audit service
      if (status !== task.status && user) {
        tasksService.updateStatus(task.id, status, user.id);
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task? This cannot be undone.")) {
      try {
        tasksService.remove(task.id);
        if (task.journeyId) {
          navigate({ to: `/journeys/${task.journeyId}` });
        } else {
          navigate({ to: "/tasks" });
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot delete task.");
      }
    }
  };

  const toggleDependency = (taskId: string) => {
    if (dependsOn.includes(taskId)) {
      setDependsOn(dependsOn.filter((id) => id !== taskId));
    } else {
      setDependsOn([...dependsOn, taskId]);
    }
  };

  const journey = journeyById.get(task.journeyId);
  const assignee = task.assigneeId ? userById.get(task.assigneeId) : null;
  const board = journey ? journeysService.board(journey.id) : null;
  const stages = board ? board.stages.map((s) => s.stage) : [];
  const stage = stages.find((s) => s.id === task.stageId);
  const journeyTasks = allTasks.filter((t) => t.journeyId === task.journeyId && t.id !== task.id);

  // Find blockers
  const blockers = task.dependsOn
    .map((depId) => taskById.get(depId))
    .filter((t): t is typeof allTasks[0] => Boolean(t));

  // Find blocked tasks
  const blockedTasks = allTasks.filter((t) => t.dependsOn.includes(task.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            if (task.journeyId) {
              navigate({ to: `/journeys/${task.journeyId}` });
            } else {
              navigate({ to: "/tasks" });
            }
          }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditing(false)}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" className="rounded-full" onClick={handleSave}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="rounded-full" onClick={startEdit}>
                <Edit2 className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" className="rounded-full" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <PageHeader
        title={task.title}
        description={`Task ID: ${task.id}`}
        meta={
          <div className="flex items-center gap-2 mt-2">
            <TaskStatusBadge status={task.status} />
            {journey && (
              <Link to={`/journeys/${journey.id}`}>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium hover:bg-accent hover:text-accent-foreground font-mono">
                  {journey.reference}
                </span>
              </Link>
            )}
            {stage && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium font-sans">
                Stage: {stage.title}
              </span>
            )}
          </div>
        }
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <section className="surface-card p-6 md:col-span-1 space-y-4 text-sm">
          <h3 className="text-base font-semibold border-b border-border pb-2">Task Attributes</h3>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Assignee</label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {activeUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-full h-8" />
              </div>
            </div>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Assignee</dt>
                <dd className="font-medium pt-1">
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar initials={assignee.initials} color={assignee.avatarColor} size="xs" />
                      <span>{assignee.firstName} {assignee.lastName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due Date</dt>
                <dd className="font-medium pt-1">
                  {task.dueDate ? formatDate(task.dueDate) : <span className="text-muted-foreground">No due date</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="font-medium pt-1 text-muted-foreground text-xs">
                  {new Date(task.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Content & Dependencies */}
        <div className="md:col-span-2 space-y-6">
          <section className="surface-card p-6 space-y-4">
            <h3 className="text-base font-semibold border-b border-border pb-2">Description</h3>
            {isEditing ? (
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-2xl" />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {task.description || "No description provided."}
              </div>
            )}
          </section>

          {/* Dependencies / Blockers */}
          <section className="surface-card p-6 space-y-4">
            <h3 className="text-base font-semibold border-b border-border pb-2">Dependencies</h3>
            {isEditing ? (
              <div className="space-y-2 text-sm">
                <label className="text-xs text-muted-foreground font-medium">Blockers (this task depends on)</label>
                {journeyTasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No other tasks in this journey.</div>
                ) : (
                  <div className="rounded-2xl border border-border p-3 max-h-32 overflow-y-auto space-y-1 bg-surface-muted">
                    {journeyTasks.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-surface p-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={dependsOn.includes(t.id)}
                          onChange={() => toggleDependency(t.id)}
                          className="rounded text-primary border-border focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="font-mono text-muted-foreground">[{t.status}]</span>
                        <span className="font-medium truncate">{t.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Blockers (depends on)</h4>
                  {blockers.length === 0 ? (
                    <div className="text-xs text-muted-foreground">This task has no blockers.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {blockers.map((b) => (
                        <li key={b.id} className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                          <Link to={`/tasks/${b.id}`} className="font-medium hover:underline text-foreground text-xs truncate">
                            {b.title}
                          </Link>
                          <TaskStatusBadge status={b.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Blocking (blocked by this task)</h4>
                  {blockedTasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No other tasks are blocked by this task.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {blockedTasks.map((b) => (
                        <li key={b.id} className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                          <Link to={`/tasks/${b.id}`} className="font-medium hover:underline text-foreground text-xs truncate">
                            {b.title}
                          </Link>
                          <TaskStatusBadge status={b.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
