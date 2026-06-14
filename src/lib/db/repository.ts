/**
 * Generic repository.
 *
 * Repositories are the only modules allowed to touch the persistence engine
 * directly. Services compose repositories to express business logic.
 */

import { persistence } from "@/lib/db/persistence";
import type { CollectionName, DatabaseSchema, Entity, ID } from "@/lib/types";

export type Predicate<T> = (entity: T) => boolean;

export interface Repository<T extends Entity> {
  list(predicate?: Predicate<T>): T[];
  findById(id: ID): T | null;
  findOne(predicate: Predicate<T>): T | null;
  insert(value: Omit<T, "id" | "createdAt" | "updatedAt"> & Partial<Pick<T, "id">>): T;
  update(id: ID, patch: Partial<Omit<T, "id" | "createdAt">>): T;
  remove(id: ID): void;
  count(predicate?: Predicate<T>): number;
}

const ID_PREFIXES: Record<CollectionName, string> = {
  users: "usr",
  sessions: "ses",
  companies: "cmp",
  contacts: "cnt",
  caseJourneys: "jrn",
  journeyStages: "stg",
  tasks: "tsk",
  knowledgeItems: "knw",
  activityLogs: "act",
  notifications: "ntf",
};

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function createId(collection: CollectionName): ID {
  return `${ID_PREFIXES[collection]}_${Date.now().toString(36)}${randomSegment()}`;
}

export function createRepository<C extends CollectionName>(
  collection: C,
): Repository<DatabaseSchema[C][number]> {
  type T = DatabaseSchema[C][number];

  const readAll = (): T[] => persistence.read(collection) as T[];
  const writeAll = (next: T[]) => persistence.write(collection, next as DatabaseSchema[C]);

  return {
    list(predicate) {
      const all = readAll();
      return predicate ? all.filter(predicate) : [...all];
    },
    findById(id) {
      return readAll().find((e) => e.id === id) ?? null;
    },
    findOne(predicate) {
      return readAll().find(predicate) ?? null;
    },
    insert(value) {
      const now = new Date().toISOString();
      const entity = {
        ...(value as object),
        id: (value as { id?: ID }).id ?? createId(collection),
        createdAt: now,
        updatedAt: now,
      } as T;
      writeAll([...readAll(), entity]);
      return entity;
    },
    update(id, patch) {
      const all = readAll();
      const index = all.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new Error(`[${collection}] entity ${id} not found`);
      }
      const updated = {
        ...all[index],
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      } as T;
      const next = [...all];
      next[index] = updated;
      writeAll(next);
      return updated;
    },
    remove(id) {
      writeAll(readAll().filter((e) => e.id !== id));
    },
    count(predicate) {
      return predicate ? readAll().filter(predicate).length : readAll().length;
    },
  };
}
