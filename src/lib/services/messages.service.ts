import { createRepository } from "@/lib/db/repository";
import { notificationsService } from "@/lib/services/notifications.service";
import type { ID, Message } from "@/lib/types";

const repo = createRepository("messages");

export const messagesService = {
  list(): Message[] {
    return repo.list().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  byUser(userId: ID): Message[] {
    return repo.list((m) => m.fromId === userId || m.toId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listBetween(userA: ID, userB: ID): Message[] {
    return repo
      .list((m) => (m.fromId === userA && m.toId === userB) || (m.fromId === userB && m.toId === userA))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  unreadCountBetween(forUser: ID, otherUser: ID) {
    return repo.list((m) => m.toId === forUser && m.fromId === otherUser && !('readAt' in m && m.readAt)).length;
  },
  markReadBetween(forUser: ID, otherUser: ID) {
    repo.list((m) => m.toId === forUser && m.fromId === otherUser && !('readAt' in m && m.readAt)).forEach((m) => {
      try {
        repo.update(m.id, { ...(m as any), readAt: new Date().toISOString() } as any);
      } catch (err) {
        // ignore
      }
    });
  },
  create(input: Omit<Message, "id" | "createdAt" | "updatedAt">) {
    const created = repo.insert(input as any);
    try {
      // Push a notification to the recipient
      notificationsService.push({
        userId: created.toId,
        title: `New message from ${created.fromId}`,
        body: created.body.slice(0, 120),
        link: "/messages",
        severity: "info",
        readAt: null,
      } as any);
    } catch (err) {
      // ignore notification failures
      // eslint-disable-next-line no-console
      console.warn("Failed to push message notification", err);
    }
    return created;
  },
  remove(id: ID) {
    repo.remove(id);
  },
};
