import { createRepository } from "@/lib/db/repository";
import type { Contact, ID } from "@/lib/types";

const contactsRepo = createRepository("contacts");
const companiesRepo = createRepository("companies");

export const contactsService = {
  list(): Contact[] {
    return [...contactsRepo.list()].sort((a, b) => a.lastName.localeCompare(b.lastName));
  },
  byCompany(companyId: ID): Contact[] {
    return contactsRepo.list((c) => c.companyId === companyId);
  },
  byId(id: ID): Contact | null {
    return contactsRepo.findById(id);
  },
  create(draft: Omit<Contact, "id" | "createdAt" | "updatedAt">): Contact {
    if (!companiesRepo.findById(draft.companyId)) {
      throw new Error("Cannot create a contact for an unknown company.");
    }
    if (!draft.email.includes("@")) throw new Error("A valid email is required.");
    return contactsRepo.insert(draft);
  },
  update(id: ID, patch: Partial<Omit<Contact, "id" | "createdAt">>): Contact {
    return contactsRepo.update(id, patch);
  },
  delete(id: ID): void {
    contactsRepo.remove(id);
  },
};
