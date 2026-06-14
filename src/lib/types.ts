/**
 * Domain types for the CRM platform.
 *
 * Every persisted entity extends `Entity` and is uniquely identified by `id`.
 * Relationships are expressed as foreign-key strings; the repository layer is
 * responsible for resolving them when needed.
 */

export type ID = string;
export type ISODateString = string;

export interface Entity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* ------------------------------------------------------------------ */
/* Identity, roles and permissions                                     */
/* ------------------------------------------------------------------ */

export type UserRole = "administrator" | "manager" | "agent" | "viewer";

export type Permission =
  | "users.read"
  | "users.write"
  | "companies.read"
  | "companies.write"
  | "contacts.read"
  | "contacts.write"
  | "journeys.read"
  | "journeys.write"
  | "journeys.assign"
  | "tasks.read"
  | "tasks.write"
  | "tasks.complete"
  | "knowledge.read"
  | "knowledge.write"
  | "settings.write";

export interface User extends Entity {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  jobTitle: string;
  avatarColor: string;
  avatarImage?: string;
  initials: string;
  status: "active" | "suspended";
  lastLoginAt: ISODateString | null;
}

export interface Session extends Entity {
  userId: ID;
  token: string;
  expiresAt: ISODateString;
  userAgent: string;
}

/* ------------------------------------------------------------------ */
/* Customer domain                                                     */
/* ------------------------------------------------------------------ */

export interface Company extends Entity {
  name: string;
  industry: string;
  size: "smb" | "mid" | "enterprise";
  website: string;
  tier: "standard" | "priority" | "strategic";
  ownerId: ID; // User
}

export interface Contact extends Entity {
  companyId: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatarColor: string;
  avatarImage?: string;
}

/* ------------------------------------------------------------------ */
/* Case journeys                                                       */
/* ------------------------------------------------------------------ */

export type JourneyStatus = "draft" | "active" | "blocked" | "resolved" | "archived";
export type StageKind =
  | "case_allocation"
  | "issue_identification"
  | "technical_resolution"
  | "new_tasks";

export interface CaseJourney extends Entity {
  title: string;
  reference: string;
  companyId: ID;
  primaryContactId: ID;
  ownerId: ID;
  status: JourneyStatus;
  priority: "low" | "medium" | "high" | "critical";
  summary: string;
}

export interface JourneyStage extends Entity {
  journeyId: ID;
  kind: StageKind;
  title: string;
  position: number;
}

export type TaskStatus = "pending" | "in_progress" | "blocked" | "completed";

export interface Task extends Entity {
  journeyId: ID;
  stageId: ID;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: ID | null;
  dueDate: ISODateString | null;
  position: number;
  dependsOn: ID[]; // task ids
}

/* ------------------------------------------------------------------ */
/* Knowledge base                                                      */
/* ------------------------------------------------------------------ */

export interface KnowledgeItem extends Entity {
  subject: string;
  status: "draft" | "executed" | "archived";
  startDate: ISODateString;
  endDate: ISODateString;
  assignedUserId: ID;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* Audit + notifications                                               */
/* ------------------------------------------------------------------ */

export interface ActivityLog extends Entity {
  userId: ID;
  entity: string;
  entityId: ID;
  action: "create" | "update" | "delete" | "assign" | "complete" | "login" | "logout";
  message: string;
}

export interface Notification extends Entity {
  userId: ID;
  title: string;
  body: string;
  readAt: ISODateString | null;
  link: string | null;
  severity: "info" | "warning" | "success";
}

/* ------------------------------------------------------------------ */
/* Database schema map (used by the persistence engine)                */
/* ------------------------------------------------------------------ */

export interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  companies: Company[];
  contacts: Contact[];
  caseJourneys: CaseJourney[];
  journeyStages: JourneyStage[];
  tasks: Task[];
  knowledgeItems: KnowledgeItem[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  messages: Message[];
}

export type CollectionName = keyof DatabaseSchema;
