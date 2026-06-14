/**
 * Authentication service.
 *
 * Implements credential verification against the users collection, issues
 * session tokens, persists them in the sessions collection and exposes
 * session restoration logic for the AuthProvider.
 */

import { createRepository } from "@/lib/db/repository";
import { activityService } from "@/lib/services/activity.service";
import type { Session, User } from "@/lib/types";

const usersRepo = createRepository("users");
const sessionsRepo = createRepository("sessions");

const ACTIVE_SESSION_KEY = "northwind.crm.v1.activeSession";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

export interface LoginInput {
  email: string;
  password: string;
}

function verifyPassword(stored: string, candidate: string): boolean {
  // Seeded users use the `plain:` prefix to make demo credentials obvious.
  // Production would replace this with a real hashing scheme without
  // touching any other module in the application.
  if (stored.startsWith("plain:")) return stored.slice("plain:".length) === candidate;
  return stored === candidate;
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface AuthenticatedSession {
  user: User;
  session: Session;
}

export const authService = {
  login({ email, password }: LoginInput): AuthenticatedSession {
    const normalisedEmail = email.trim().toLowerCase();
    const user = usersRepo.findOne((u) => u.email.toLowerCase() === normalisedEmail);
    if (!user) throw new Error("Invalid email or password.");
    if (user.status !== "active") throw new Error("This account has been suspended.");
    if (!verifyPassword(user.passwordHash, password)) {
      throw new Error("Invalid email or password.");
    }

    const session = sessionsRepo.insert({
      userId: user.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
    });

    const refreshedUser = usersRepo.update(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, session.token);
    }

    activityService.log({
      userId: refreshedUser.id,
      entity: "users",
      entityId: refreshedUser.id,
      action: "login",
      message: `${refreshedUser.firstName} ${refreshedUser.lastName} signed in.`,
    });

    return { user: refreshedUser, session };
  },

  logout(): void {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (token) {
      const session = sessionsRepo.findOne((s) => s.token === token);
      if (session) {
        const user = usersRepo.findById(session.userId);
        sessionsRepo.remove(session.id);
        if (user) {
          activityService.log({
            userId: user.id,
            entity: "users",
            entityId: user.id,
            action: "logout",
            message: `${user.firstName} ${user.lastName} signed out.`,
          });
        }
      }
    }
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  restore(): AuthenticatedSession | null {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!token) return null;

    const session = sessionsRepo.findOne((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionsRepo.remove(session.id);
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      return null;
    }

    const user = usersRepo.findById(session.userId);
    if (!user || user.status !== "active") {
      sessionsRepo.remove(session.id);
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      return null;
    }
    return { user, session };
  },
};
