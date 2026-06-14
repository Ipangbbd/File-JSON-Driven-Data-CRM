import { createRepository } from "@/lib/db/repository";
import { activityService } from "@/lib/services/activity.service";
import { tasksService } from "@/lib/services/tasks.service";
import type {
  CaseJourney,
  ID,
  JourneyStage,
  StageKind,
  Task,
} from "@/lib/types";

const journeysRepo = createRepository("caseJourneys");
const stagesRepo = createRepository("journeyStages");
const tasksRepo = createRepository("tasks");
const contactsRepo = createRepository("contacts");
const companiesRepo = createRepository("companies");
const usersRepo = createRepository("users");

const DEFAULT_STAGES: { kind: StageKind; title: string }[] = [
  { kind: "case_allocation", title: "Case Allocation" },
  { kind: "issue_identification", title: "Issue Identification" },
  { kind: "technical_resolution", title: "Technical Resolution" },
  { kind: "new_tasks", title: "New Tasks" },
];

export interface JourneyBoardModel {
  journey: CaseJourney;
  stages: Array<{
    stage: JourneyStage;
    tasks: Task[];
  }>;
  assignees: ID[];
  completion: number;
  openTaskCount: number;
}

export interface JourneyDraft {
  title: string;
  reference: string;
  companyId: ID;
  primaryContactId: ID;
  ownerId: ID;
  priority: CaseJourney["priority"];
  summary: string;
}

export const journeysService = {
  list(): CaseJourney[] {
    return [...journeysRepo.list()].sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
  },

  byId(id: ID): CaseJourney | null {
    return journeysRepo.findById(id);
  },

  board(id: ID): JourneyBoardModel | null {
    const journey = journeysRepo.findById(id);
    if (!journey) return null;
    return this.boardFor(journey);
  },

  boards(): JourneyBoardModel[] {
    return this.list().map((journey) => this.boardFor(journey));
  },

  boardFor(journey: CaseJourney): JourneyBoardModel {
    const stages = stagesRepo
      .list((s) => s.journeyId === journey.id)
      .sort((a, b) => a.position - b.position);
    const allTasks = tasksRepo.list((t) => t.journeyId === journey.id);

    const stagesWithTasks = stages.map((stage) => ({
      stage,
      tasks: allTasks
        .filter((t) => t.stageId === stage.id)
        .sort((a, b) => a.position - b.position),
    }));

    const assigneeSet = new Set<ID>();
    allTasks.forEach((t) => {
      if (t.assigneeId) assigneeSet.add(t.assigneeId);
    });

    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === "completed").length;

    return {
      journey,
      stages: stagesWithTasks,
      assignees: Array.from(assigneeSet),
      completion: total === 0 ? 0 : Math.round((done / total) * 100),
      openTaskCount: total - done,
    };
  },

  create(draft: JourneyDraft, actorId: ID): CaseJourney {
    if (!companiesRepo.findById(draft.companyId)) {
      throw new Error("Cannot create a journey without a valid company.");
    }
    if (!contactsRepo.findById(draft.primaryContactId)) {
      throw new Error("The primary contact does not exist.");
    }
    if (!usersRepo.findById(draft.ownerId)) {
      throw new Error("Journey owner must be an existing user.");
    }

    const journey = journeysRepo.insert({ ...draft, status: "active" });
    DEFAULT_STAGES.forEach((stage, index) => {
      stagesRepo.insert({
        journeyId: journey.id,
        kind: stage.kind,
        title: stage.title,
        position: index,
      });
    });

    activityService.log({
      userId: actorId,
      entity: "caseJourneys",
      entityId: journey.id,
      action: "create",
      message: `Created case journey ${journey.reference}.`,
    });
    return journey;
  },

  update(
    id: ID,
    patch: Partial<Omit<CaseJourney, "id" | "createdAt" | "reference" | "companyId" | "primaryContactId">>,
    actorId: ID,
  ): CaseJourney {
    const updated = journeysRepo.update(id, patch);
    activityService.log({
      userId: actorId,
      entity: "caseJourneys",
      entityId: id,
      action: "update",
      message: `Updated case journey information.`,
    });
    return updated;
  },

  updateStatus(id: ID, status: CaseJourney["status"], actorId: ID): CaseJourney {
    const updated = journeysRepo.update(id, { status });
    activityService.log({
      userId: actorId,
      entity: "caseJourneys",
      entityId: id,
      action: "update",
      message: `Set status to ${status}.`,
    });
    return updated;
  },

  archive(id: ID, actorId: ID): void {
    const open = tasksRepo.count(
      (t) => t.journeyId === id && t.status !== "completed",
    );
    if (open > 0) {
      throw new Error(
        `Cannot archive: ${open} task${open === 1 ? "" : "s"} still open.`,
      );
    }
    journeysRepo.update(id, { status: "archived" });
    activityService.log({
      userId: actorId,
      entity: "caseJourneys",
      entityId: id,
      action: "update",
      message: "Archived journey.",
    });
  },

  remove(id: ID): void {
    tasksService.removeAllForJourney(id);
    stagesRepo.list((s) => s.journeyId === id).forEach((s) => stagesRepo.remove(s.id));
    journeysRepo.remove(id);
  },
};
