import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/crm/PageHeader";
import { useStore } from "@/lib/providers/DataProvider";
import { knowledgeService } from "@/lib/services/knowledge.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Base — Northwind CRM" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const items = useStore(() => knowledgeService.list());
  const users = useStore(() => usersService.list());
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Runbooks, articles and reusable resolution material."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const owner = userById.get(item.assignedUserId);
          return (
            <article key={item.id} className="surface-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{item.subject}</h3>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize">
                  {item.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Start</dt>
                  <dd>{formatDate(item.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">End</dt>
                  <dd>{formatDate(item.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd>{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
