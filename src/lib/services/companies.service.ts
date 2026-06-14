import { createRepository } from "@/lib/db/repository";
import type { Company, ID } from "@/lib/types";

const companiesRepo = createRepository("companies");
const contactsRepo = createRepository("contacts");
const journeysRepo = createRepository("caseJourneys");

export const companiesService = {
  list(): Company[] {
    return [...companiesRepo.list()].sort((a, b) => a.name.localeCompare(b.name));
  },
  byId(id: ID): Company | null {
    return companiesRepo.findById(id);
  },
  create(draft: Omit<Company, "id" | "createdAt" | "updatedAt">): Company {
    if (!draft.name.trim()) throw new Error("Company name is required.");
    return companiesRepo.insert(draft);
  },
  update(id: ID, patch: Partial<Omit<Company, "id" | "createdAt">>): Company {
    return companiesRepo.update(id, patch);
  },
  delete(id: ID): void {
    if (contactsRepo.count((c) => c.companyId === id) > 0) {
      throw new Error("Remove or reassign contacts before deleting this company.");
    }
    if (journeysRepo.count((j) => j.companyId === id) > 0) {
      throw new Error("Archive related case journeys before deleting this company.");
    }
    companiesRepo.remove(id);
  },
};
