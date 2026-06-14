import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Plus, Eye } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/providers/DataProvider";
import { knowledgeService } from "@/lib/services/knowledge.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Base — Northwind CRM" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/knowledge";
  const items = useStore(() => knowledgeService.list());
  const users = useStore(() => usersService.list());
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Runbooks, articles and reusable resolution material."
        actions={
          <Link to="/knowledge/new">
            <Button className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> New Runbook
            </Button>
          </Link>
        }
      />

      {isRoot && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const owner = userById.get(item.assignedUserId);
            return (
              <article key={item.id} className="surface-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-muted-foreground/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Link to={`/knowledge/${item.id}`} className="hover:underline">
                      <h3 className="text-base font-semibold text-foreground">{item.subject}</h3>
                    </Link>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize shrink-0">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
                  <dl className="grid grid-cols-3 gap-2 flex-1">
                    <div>
                      <dt className="text-muted-foreground">Start</dt>
                      <dd className="font-medium">{formatDate(item.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">End</dt>
                      <dd className="font-medium">{formatDate(item.endDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Owner</dt>
                      <dd className="font-medium">{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</dd>
                    </div>
                  </dl>
                  <Link to={`/knowledge/${item.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-full shrink-0">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Outlet />
    </div>
  );
}
