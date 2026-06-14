import type { Permission, UserRole } from "@/lib/types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  administrator: [
    "users.read", "users.write",
    "companies.read", "companies.write",
    "contacts.read", "contacts.write",
    "journeys.read", "journeys.write", "journeys.assign",
    "tasks.read", "tasks.write", "tasks.complete",
    "knowledge.read", "knowledge.write",
    "settings.write",
  ],
  manager: [
    "users.read",
    "companies.read", "companies.write",
    "contacts.read", "contacts.write",
    "journeys.read", "journeys.write", "journeys.assign",
    "tasks.read", "tasks.write", "tasks.complete",
    "knowledge.read", "knowledge.write",
  ],
  agent: [
    "companies.read",
    "contacts.read", "contacts.write",
    "journeys.read",
    "tasks.read", "tasks.write", "tasks.complete",
    "knowledge.read",
  ],
  viewer: [
    "companies.read",
    "contacts.read",
    "journeys.read",
    "tasks.read",
    "knowledge.read",
  ],
};

export function permissionsFor(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role "${role}" lacks permission "${permission}"`);
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
  manager: "Manager",
  agent: "Support Agent",
  viewer: "Viewer",
};
