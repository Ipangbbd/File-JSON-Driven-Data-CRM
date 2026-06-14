/**
 * Persistence engine.
 *
 * The CRM uses JSON files as the canonical source of seed data. At runtime the
 * data is hydrated into an in-memory store backed by `localStorage`, which acts
 * as our durable, client-side "database". Every collection lives under its own
 * storage key so the schema can evolve incrementally and so a future migration
 * to a real backend only needs to swap this single module.
 */

import type { CollectionName, DatabaseSchema } from "@/lib/types";

import users from "@/data/seed/users.json";
import sessions from "@/data/seed/sessions.json";
import companies from "@/data/seed/companies.json";
import contacts from "@/data/seed/contacts.json";
import caseJourneys from "@/data/seed/caseJourneys.json";
import journeyStages from "@/data/seed/journeyStages.json";
import tasks from "@/data/seed/tasks.json";
import knowledgeItems from "@/data/seed/knowledgeItems.json";
import notifications from "@/data/seed/notifications.json";
import activityLogs from "@/data/seed/activityLogs.json";

const STORAGE_NAMESPACE = "northwind.crm.v1";
const SCHEMA_VERSION_KEY = `${STORAGE_NAMESPACE}.schemaVersion`;
const SCHEMA_VERSION = 1;

const SEEDS: DatabaseSchema = {
  users: users as DatabaseSchema["users"],
  sessions: sessions as DatabaseSchema["sessions"],
  companies: companies as DatabaseSchema["companies"],
  contacts: contacts as DatabaseSchema["contacts"],
  caseJourneys: caseJourneys as DatabaseSchema["caseJourneys"],
  journeyStages: journeyStages as DatabaseSchema["journeyStages"],
  tasks: tasks as DatabaseSchema["tasks"],
  knowledgeItems: knowledgeItems as DatabaseSchema["knowledgeItems"],
  notifications: notifications as DatabaseSchema["notifications"],
  activityLogs: activityLogs as DatabaseSchema["activityLogs"],
};

type ChangeListener = (collection: CollectionName) => void;

class PersistenceEngine {
  private cache: Partial<Record<CollectionName, unknown[]>> = {};
  private listeners = new Set<ChangeListener>();
  private hydrated = false;

  isReady(): boolean {
    return this.hydrated;
  }

  hydrate(): void {
    if (typeof window === "undefined" || this.hydrated) return;

    const storedVersion = window.localStorage.getItem(SCHEMA_VERSION_KEY);
    const isFreshOrStale = storedVersion !== String(SCHEMA_VERSION);

    (Object.keys(SEEDS) as CollectionName[]).forEach((collection) => {
      const key = this.storageKey(collection);
      if (isFreshOrStale || window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify(SEEDS[collection]));
      }
      const raw = window.localStorage.getItem(key);
      this.cache[collection] = raw ? JSON.parse(raw) : [];
    });

    window.localStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
    this.hydrated = true;
  }

  read<C extends CollectionName>(collection: C): DatabaseSchema[C] {
    this.ensureHydrated();
    return (this.cache[collection] ?? []) as DatabaseSchema[C];
  }

  write<C extends CollectionName>(collection: C, value: DatabaseSchema[C]): void {
    this.ensureHydrated();
    this.cache[collection] = value as unknown[];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(this.storageKey(collection), JSON.stringify(value));
    }
    this.notify(collection);
  }

  resetToSeed(): void {
    if (typeof window === "undefined") return;
    (Object.keys(SEEDS) as CollectionName[]).forEach((collection) => {
      window.localStorage.removeItem(this.storageKey(collection));
    });
    window.localStorage.removeItem(SCHEMA_VERSION_KEY);
    this.cache = {};
    this.hydrated = false;
    this.hydrate();
    (Object.keys(SEEDS) as CollectionName[]).forEach((c) => this.notify(c));
  }

  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(collection: CollectionName): void {
    this.listeners.forEach((l) => l(collection));
  }

  private ensureHydrated(): void {
    if (!this.hydrated) this.hydrate();
  }

  private storageKey(collection: CollectionName): string {
    return `${STORAGE_NAMESPACE}.${collection}`;
  }
}

export const persistence = new PersistenceEngine();
