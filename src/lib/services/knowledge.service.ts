import { createRepository } from "@/lib/db/repository";
import type { ID, KnowledgeItem } from "@/lib/types";

const repo = createRepository("knowledgeItems");
const usersRepo = createRepository("users");

export const knowledgeService = {
  list(): KnowledgeItem[] {
    return [...repo.list()].sort((a, b) => b.startDate.localeCompare(a.startDate));
  },
  byId(id: ID): KnowledgeItem | null {
    return repo.findById(id);
  },
  suggestionsFor(): KnowledgeItem[] {
    return this.list().slice(0, 5);
  },
  create(draft: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">): KnowledgeItem {
    if (!usersRepo.findById(draft.assignedUserId)) {
      throw new Error("Assigned user does not exist.");
    }
    if (new Date(draft.endDate) < new Date(draft.startDate)) {
      throw new Error("End date cannot precede start date.");
    }
    return repo.insert(draft);
  },
  update(id: ID, patch: Partial<Omit<KnowledgeItem, "id" | "createdAt">>): KnowledgeItem {
    return repo.update(id, patch);
  },
  delete(id: ID): void {
    repo.remove(id);
  },
};
