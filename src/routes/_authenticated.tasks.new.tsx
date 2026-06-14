import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/crm/PageHeader";
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

const searchSchema = z.object({
  defaultJourneyId: z.string().optional(),
  defaultStageId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/tasks/new")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "New Task — Northwind CRM" }] }),
  component: NewTaskPage,
});

function NewTaskPage() {
  const { defaultJourneyId, defaultStageId } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const journeys = useStore(() => journeysService.list());
  const users = useStore(() => usersService.list().filter((u) => u.status === "active"));
  const tasks = useStore(() => tasksService.list());

  const [journeyId, setJourneyId] = useState(defaultJourneyId ?? "");
  const [stageId, setStageId] = useState(defaultStageId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch stages of selected journey
  const board = useStore(() => (journeyId ? journeysService.board(journeyId) : null));
  const stages = board ? board.stages.map((s) => s.stage) : [];
  const journeyTasks = tasks.filter((t) => t.journeyId === journeyId);

  // Auto-select first stage when journey changes
  useEffect(() => {
    if (stages.length > 0) {
      if (defaultStageId && stages.some((s) => s.id === defaultStageId)) {
        setStageId(defaultStageId);
      } else {
        setStageId(stages[0].id);
      }
    } else {
      setStageId("");
    }
    setDependsOn([]);
  }, [journeyId, stages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!journeyId) {
      setError("Please select a case journey.");
      return;
    }
    if (!stageId) {
      setError("Please select a journey stage.");
      return;
    }

    try {
      tasksService.create(
        {
          journeyId,
          stageId,
          title,
          description,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          dependsOn,
        },
        user?.id ?? "system"
      );

      if (journeyId) {
        navigate({ to: `/journeys/${journeyId}` });
      } else {
        navigate({ to: "/tasks" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    }
  };

  const toggleDependency = (taskId: string) => {
    if (dependsOn.includes(taskId)) {
      setDependsOn(dependsOn.filter((id) => id !== taskId));
    } else {
      setDependsOn([...dependsOn, taskId]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            if (journeyId) {
              navigate({ to: `/journeys/${journeyId}` });
            } else {
              navigate({ to: "/tasks" });
            }
          }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title="New Task"
        description="Create a work item within a case journey."
      />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Task Title *</label>
          <Input
            placeholder="e.g. Schedule technical review call"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-full border-border bg-surface"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Add details, links, or instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-2xl border-border bg-surface"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Case Journey *</label>
            <Select value={journeyId} onValueChange={setJourneyId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder="Select Journey" />
              </SelectTrigger>
              <SelectContent>
                {journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.reference} — {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Journey Stage *</label>
            <Select value={stageId} onValueChange={setStageId} disabled={!journeyId || stages.length === 0}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder={journeyId ? "Select Stage" : "Select Journey First"} />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-full border-border bg-surface h-10"
            />
          </div>
        </div>

        {journeyId && journeyTasks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Blocker Dependencies (depends on)</label>
            <div className="rounded-2xl border border-border p-3 max-h-32 overflow-y-auto space-y-1.5 bg-surface-muted">
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
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (journeyId) {
                navigate({ to: `/journeys/${journeyId}` });
              } else {
                navigate({ to: "/tasks" });
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full">
            <Save className="mr-1.5 h-4 w-4" /> Save Task
          </Button>
        </div>
      </form>
    </div>
  );
}
