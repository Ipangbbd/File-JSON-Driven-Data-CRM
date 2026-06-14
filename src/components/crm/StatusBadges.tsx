import { cn } from "@/lib/utils";
import type { JourneyStatus, TaskStatus } from "@/lib/types";

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  blocked: "bg-destructive/10 text-destructive",
  completed: "bg-success/10 text-success",
};

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        TASK_STATUS_STYLE[status],
        className,
      )}
    >
      {TASK_STATUS_LABEL[status]}
    </span>
  );
}

const JOURNEY_STATUS_STYLE: Record<JourneyStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-info/10 text-info",
  blocked: "bg-destructive/10 text-destructive",
  resolved: "bg-success/10 text-success",
  archived: "bg-secondary text-secondary-foreground",
};

const JOURNEY_STATUS_LABEL: Record<JourneyStatus, string> = {
  draft: "Draft",
  active: "Active",
  blocked: "Blocked",
  resolved: "Resolved",
  archived: "Archived",
};

export function JourneyStatusBadge({ status }: { status: JourneyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        JOURNEY_STATUS_STYLE[status],
      )}
    >
      {JOURNEY_STATUS_LABEL[status]}
    </span>
  );
}

const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
        PRIORITY_STYLE[priority] ?? "bg-muted text-muted-foreground",
      )}
    >
      {priority}
    </span>
  );
}
