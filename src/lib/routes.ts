/**
 * Centralised route registry. Every navigable surface is declared here so the
 * navigation primitives and access guards stay in lock-step with the router.
 */

import type { Permission } from "@/lib/types";

export interface RouteDefinition {
  path: string;
  label: string;
  description?: string;
  requires?: Permission;
}

export const ROUTES = {
  login: { path: "/login", label: "Sign in" },
  dashboard: {
    path: "/",
    label: "Customer Journeys",
    description: "Workflow workspace across every active case journey.",
    requires: "journeys.read",
  },
  companies: {
    path: "/companies",
    label: "Companies",
    description: "Accounts and customer relationships.",
    requires: "companies.read",
  },
  contacts: {
    path: "/contacts",
    label: "Contacts",
    description: "People associated with customer accounts.",
    requires: "contacts.read",
  },
  tasks: {
    path: "/tasks",
    label: "Tasks",
    description: "Work assigned across every customer journey.",
    requires: "tasks.read",
  },
  knowledge: {
    path: "/knowledge",
    label: "Knowledge Base",
    description: "Runbooks, articles and reusable resolution material.",
    requires: "knowledge.read",
  },
  adminUsers: {
    path: "/admin/users",
    label: "User Management",
    description: "Provision and govern internal users.",
    requires: "users.read",
  },
  profile: {
    path: "/profile",
    label: "Profile",
  },
  settings: {
    path: "/settings",
    label: "Settings",
    requires: "settings.write",
  },
} satisfies Record<string, RouteDefinition>;

export type RouteKey = keyof typeof ROUTES;
