import { createRepository } from "@/lib/db/repository";
import type { ActivityLog } from "@/lib/types";

const repo = createRepository("activityLogs");

export const activityService = {
  log(input: Omit<ActivityLog, "id" | "createdAt" | "updatedAt">): ActivityLog {
    return repo.insert(input);
  },
  recent(limit = 25): ActivityLog[] {
    return [...repo.list()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
  forEntity(entity: string, entityId: string): ActivityLog[] {
    return repo
      .list((l) => l.entity === entity && l.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
