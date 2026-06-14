import { createRepository } from "@/lib/db/repository";
import type { ID, Notification } from "@/lib/types";

const repo = createRepository("notifications");

export const notificationsService = {
  forUser(userId: ID): Notification[] {
    return repo
      .list((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  unreadCount(userId: ID): number {
    return repo.count((n) => n.userId === userId && n.readAt === null);
  },
  markRead(id: ID): void {
    repo.update(id, { readAt: new Date().toISOString() });
  },
  markAllRead(userId: ID): void {
    repo
      .list((n) => n.userId === userId && n.readAt === null)
      .forEach((n) => repo.update(n.id, { readAt: new Date().toISOString() }));
  },
  push(input: Omit<Notification, "id" | "createdAt" | "updatedAt">): Notification {
    return repo.insert(input);
  },
};
