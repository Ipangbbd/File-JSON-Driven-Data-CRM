import { createRepository } from "@/lib/db/repository";
import type { ID, User, UserRole } from "@/lib/types";

const usersRepo = createRepository("users");
const journeysRepo = createRepository("caseJourneys");
const tasksRepo = createRepository("tasks");
const companiesRepo = createRepository("companies");

export interface UserDraft {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  role: UserRole;
  password: string;
  avatarColor?: string;
}

const PALETTE = ["#0F172A", "#1D4ED8", "#0EA5A4", "#F97316", "#DB2777", "#9333EA", "#16A34A"];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export const usersService = {
  list(): User[] {
    return [...usersRepo.list()].sort((a, b) => a.lastName.localeCompare(b.lastName));
  },
  byId(id: ID): User | null {
    return usersRepo.findById(id);
  },
  byIds(ids: ID[]): User[] {
    const set = new Set(ids);
    return usersRepo.list((u) => set.has(u.id));
  },
  create(draft: UserDraft): User {
    if (!draft.email.includes("@")) throw new Error("A valid email is required.");
    if (draft.password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (usersRepo.findOne((u) => u.email.toLowerCase() === draft.email.toLowerCase())) {
      throw new Error("A user with this email already exists.");
    }
    return usersRepo.insert({
      email: draft.email,
      passwordHash: `plain:${draft.password}`,
      firstName: draft.firstName,
      lastName: draft.lastName,
      jobTitle: draft.jobTitle,
      role: draft.role,
      avatarColor: draft.avatarColor ?? pickColor(draft.email),
      initials: initialsFor(draft.firstName, draft.lastName),
      status: "active",
      lastLoginAt: null,
    });
  },
  updateRole(id: ID, role: UserRole): User {
    return usersRepo.update(id, { role });
  },
  suspend(id: ID): User {
    return usersRepo.update(id, { status: "suspended" });
  },
  reactivate(id: ID): User {
    return usersRepo.update(id, { status: "active" });
  },
  /**
   * Deleting a user is destructive; the service refuses to orphan dependent
   * records and instead requires the caller to provide a reassignment target.
   */
  delete(id: ID, reassignTo: ID): void {
    if (id === reassignTo) throw new Error("Reassignment target must differ.");
    if (!usersRepo.findById(reassignTo)) throw new Error("Reassignment target not found.");

    journeysRepo
      .list((j) => j.ownerId === id)
      .forEach((j) => journeysRepo.update(j.id, { ownerId: reassignTo }));

    tasksRepo
      .list((t) => t.assigneeId === id)
      .forEach((t) => tasksRepo.update(t.id, { assigneeId: reassignTo }));

    companiesRepo
      .list((c) => c.ownerId === id)
      .forEach((c) => companiesRepo.update(c.id, { ownerId: reassignTo }));

    usersRepo.remove(id);
  },
  workload(id: ID): { open: number; completed: number } {
    const tasks = tasksRepo.list((t) => t.assigneeId === id);
    return {
      open: tasks.filter((t) => t.status !== "completed").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  },
};
