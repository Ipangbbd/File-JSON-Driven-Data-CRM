import { createRepository } from "@/lib/db/repository";
import { activityService } from "@/lib/services/activity.service";
import type { ID, Task, TaskStatus } from "@/lib/types";

const tasksRepo = createRepository("tasks");
const stagesRepo = createRepository("journeyStages");
const journeysRepo = createRepository("caseJourneys");
const usersRepo = createRepository("users");

export interface TaskDraft {
  journeyId: ID;
  stageId: ID;
  title: string;
  description: string;
  assigneeId: ID | null;
  dueDate: string | null;
  dependsOn?: ID[];
}

function nextPositionWithinStage(stageId: ID): number {
  const siblings = tasksRepo.list((t) => t.stageId === stageId);
  return siblings.length === 0
    ? 0
    : Math.max(...siblings.map((t) => t.position)) + 1;
}

export const tasksService = {
  list(): Task[] {
    return [...tasksRepo.list()].sort((a, b) => {
      const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return dueA - dueB;
    });
  },

  byId(id: ID): Task | null {
    return tasksRepo.findById(id);
  },

  forAssignee(userId: ID): Task[] {
    return tasksRepo.list((t) => t.assigneeId === userId);
  },

  create(draft: TaskDraft, actorId: ID): Task {
    if (!journeysRepo.findById(draft.journeyId)) {
      throw new Error("Cannot attach a task to an unknown journey.");
    }
    if (!stagesRepo.findById(draft.stageId)) {
      throw new Error("Cannot attach a task to an unknown stage.");
    }
    if (draft.assigneeId && !usersRepo.findById(draft.assigneeId)) {
      throw new Error("Assignee does not exist.");
    }

    const task = tasksRepo.insert({
      journeyId: draft.journeyId,
      stageId: draft.stageId,
      title: draft.title,
      description: draft.description,
      status: "pending",
      assigneeId: draft.assigneeId,
      dueDate: draft.dueDate,
      position: nextPositionWithinStage(draft.stageId),
      dependsOn: draft.dependsOn ?? [],
    });
    activityService.log({
      userId: actorId,
      entity: "tasks",
      entityId: task.id,
      action: "create",
      message: `Created task ${task.title}.`,
    });
    return task;
  },

  updateStatus(id: ID, status: TaskStatus, actorId: ID): Task {
    const current = tasksRepo.findById(id);
    if (!current) throw new Error("Task not found.");

    if (status === "completed" && current.dependsOn.length > 0) {
      const blockers = current.dependsOn
        .map((depId) => tasksRepo.findById(depId))
        .filter((dep): dep is Task => Boolean(dep) && dep!.status !== "completed");
      if (blockers.length > 0) {
        throw new Error(
          `Cannot complete: depends on ${blockers.length} incomplete task${blockers.length === 1 ? "" : "s"}.`,
        );
      }
    }

    const updated = tasksRepo.update(id, { status });
    activityService.log({
      userId: actorId,
      entity: "tasks",
      entityId: id,
      action: status === "completed" ? "complete" : "update",
      message: `Set "${updated.title}" to ${status.replace("_", " ")}.`,
    });
    journeysRepo.update(updated.journeyId, {});
    return updated;
  },

  assign(id: ID, assigneeId: ID | null, actorId: ID): Task {
    if (assigneeId && !usersRepo.findById(assigneeId)) {
      throw new Error("Assignee does not exist.");
    }
    const updated = tasksRepo.update(id, { assigneeId });
    const user = assigneeId ? usersRepo.findById(assigneeId) : null;
    activityService.log({
      userId: actorId,
      entity: "tasks",
      entityId: id,
      action: "assign",
      message: user
        ? `Assigned "${updated.title}" to ${user.firstName} ${user.lastName}.`
        : `Unassigned "${updated.title}".`,
    });
    return updated;
  },

  update(id: ID, patch: Partial<Omit<Task, "id" | "createdAt" | "journeyId">>): Task {
    return tasksRepo.update(id, patch);
  },

  remove(id: ID): void {
    tasksRepo.list((t) => t.dependsOn.includes(id)).forEach((dep) => {
      tasksRepo.update(dep.id, {
        dependsOn: dep.dependsOn.filter((depId) => depId !== id),
      });
    });
    tasksRepo.remove(id);
  },

  removeAllForJourney(journeyId: ID): void {
    tasksRepo.list((t) => t.journeyId === journeyId).forEach((t) => tasksRepo.remove(t.id));
  },
};
