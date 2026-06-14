import { Calendar, CheckCircle2, MoreHorizontal, Plus, Share2 } from "lucide-react";

import { AvatarStack, UserAvatar } from "@/components/crm/UserAvatar";
import { TaskStatusBadge } from "@/components/crm/StatusBadges";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { journeysService, type JourneyBoardModel } from "@/lib/services/journeys.service";
import { tasksService } from "@/lib/services/tasks.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, User } from "@/lib/types";

const STAGE_TONE: Record<string, string> = {
  case_allocation: "from-[oklch(0.97_0.012_270)] to-[oklch(0.94_0.03_268)]",
  issue_identification: "from-[oklch(0.97_0.012_270)] to-[oklch(0.93_0.04_252)]",
  technical_resolution: "from-[oklch(0.97_0.012_270)] to-[oklch(0.93_0.05_18)]",
  new_tasks: "from-[oklch(0.97_0.012_270)] to-[oklch(0.93_0.04_295)]",
};

// Dark-mode variants for the stage tones (subtle, darker tints)
const STAGE_TONE_DARK: Record<string, string> = {
  case_allocation: "dark:from-[oklch(0.12_0.02_260)] dark:to-[oklch(0.08_0.02_260)]",
  issue_identification: "dark:from-[oklch(0.13_0.02_252)] dark:to-[oklch(0.09_0.02_252)]",
  technical_resolution: "dark:from-[oklch(0.13_0.02_18)] dark:to-[oklch(0.09_0.02_18)]",
  new_tasks: "dark:from-[oklch(0.13_0.02_295)] dark:to-[oklch(0.09_0.02_295)]",
};

export function JourneyBoard({ journeyId }: { journeyId: string }) {
  const board = useStore<JourneyBoardModel | null>(() => journeysService.board(journeyId));
  const users = useStore(() => usersService.list());
  const usersById = new Map(users.map((u) => [u.id, u]));

  if (!board) {
    return (
      <div className="surface-card p-10 text-center text-sm text-muted-foreground">
        Journey not found.
      </div>
    );
  }

  const { journey, stages, assignees } = board;
  const assigneeUsers = assignees
    .map((id) => usersById.get(id))
    .filter((u): u is User => Boolean(u));

  return (
    <section
      className={cn(
        "surface-card relative overflow-hidden bg-gradient-to-br p-6 lg:p-8",
        // light theme gradient (keeps existing look)
        "from-[oklch(0.97_0.01_260)] to-[oklch(0.94_0.03_268)]",
        // in dark mode use a subtle surface background and make the gradient transparent
        "dark:from-transparent dark:to-transparent dark:bg-surface/20",
      )}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {journey.reference}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{journey.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <AvatarStack users={assigneeUsers} max={7} size="md" />
          <div className="flex items-center gap-2">
            <IconButton><Plus className="h-4 w-4" /></IconButton>
            <IconButton><Share2 className="h-4 w-4" /></IconButton>
            <IconButton><Calendar className="h-4 w-4" /></IconButton>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map(({ stage, tasks }) => (
          <StageColumn key={stage.id} title={stage.title} tone={STAGE_TONE[stage.kind]} darkTone={STAGE_TONE_DARK[stage.kind]}>
            {tasks.length === 0 ? (
              <EmptyStage />
            ) : stage.kind === "case_allocation" ? (
              tasks.map((task) => (
                <AllocationCard key={task.id} task={task} assignee={task.assigneeId ? usersById.get(task.assigneeId) ?? null : null} />
              ))
            ) : (
              tasks.map((task) => (
                <TaskRow key={task.id} task={task} assignee={task.assigneeId ? usersById.get(task.assigneeId) ?? null : null} />
              ))
            )}
          </StageColumn>
        ))}
      </div>
    </section>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </button>
  );
}

function StageColumn({
  title,
  tone,
  darkTone,
  children,
}: {
  title: string;
  tone?: string;
  darkTone?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={cn(
        "surface-panel flex flex-col gap-3 bg-gradient-to-b p-3",
        tone,
        // Use a solid surface fill in dark mode for a cleaner, less 'AI-pastel' look
        "dark:bg-surface/80 dark:from-transparent dark:to-transparent",
      )}>
        {children}
      </div>
      <div className="text-center text-xs font-medium text-muted-foreground">{title}</div>
    </div>
  );
}

function EmptyStage() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 dark:bg-surface/30 px-3 py-6 text-center text-xs text-muted-foreground">
      No work in this stage yet.
    </div>
  );
}

function AllocationCard({ task, assignee }: { task: Task; assignee: User | null }) {
  const { user, can } = useAuth();
  return (
    <article className="surface-panel flex flex-col gap-3 bg-surface dark:bg-surface/80 p-4">
      <div className="flex items-center justify-between">
        {assignee ? (
          <UserAvatar initials={assignee.initials} color={assignee.avatarColor} imageSrc={assignee.avatarImage} size="md" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-secondary" />
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CompleteAction task={task} disabled={!user || !can("tasks.complete")} />
          <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
      <div className="flex items-center justify-between">
        <TaskStatusBadge status={task.status} />
        {task.dueDate && (
          <span className="text-[11px] text-muted-foreground">{formatDate(task.dueDate)}</span>
        )}
      </div>
    </article>
  );
}

function TaskRow({ task, assignee }: { task: Task; assignee: User | null }) {
  const { user, can } = useAuth();
  return (
    <article
      className={cn(
        "surface-panel flex items-center gap-3 bg-surface dark:bg-surface/80 px-3 py-2.5",
        task.status === "completed" && "opacity-80",
      )}
    >
      {assignee ? (
        <UserAvatar initials={assignee.initials} color={assignee.avatarColor} imageSrc={assignee.avatarImage} size="sm" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-border text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-snug text-foreground">{task.title}</p>
        <p className="text-[11px] text-muted-foreground">{formatDate(task.dueDate)}</p>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <CompleteAction task={task} disabled={!user || !can("tasks.complete")} />
        <button className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function CompleteAction({ task, disabled }: { task: Task; disabled?: boolean }) {
  const { user } = useAuth();
  const completed = task.status === "completed";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!user) return;
        try {
          tasksService.updateStatus(task.id, completed ? "pending" : "completed", user.id);
        } catch (error) {
          // Surfacing in a toast belongs in a global handler — for now log so
          // the UI behaviour stays predictable in the demo.
          console.warn(error);
        }
      }}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full transition",
        completed
          ? "bg-success/15 text-success"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40",
      )}
      title={completed ? "Reopen task" : "Mark as complete"}
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  );
}
