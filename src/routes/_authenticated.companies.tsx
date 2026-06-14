import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Plus, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";
import { usersService } from "@/lib/services/users.service";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "Companies — Northwind CRM" }] }),
  component: CompaniesPage,
});

const TIER_LABEL: Record<string, string> = {
  standard: "Standard",
  priority: "Priority",
  strategic: "Strategic",
};

function CompaniesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/companies";

  const companies = useStore(() => companiesService.list());
  const contacts = useStore(() => contactsService.list());
  const users = useStore(() => usersService.list());
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Accounts and customer relationships."
        actions={
          <Link to="/companies/new">
            <Button className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> New company
            </Button>
          </Link>
        }
      />

      {isRoot && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const owner = userById.get(company.ownerId);
            const contactCount = contacts.filter((c) => c.companyId === company.id).length;
            return (
              <article key={company.id} className="surface-card flex flex-col gap-4 p-6 transition-all duration-300 hover:shadow-md hover:border-muted-foreground/30">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/companies/${company.id}`} className="hover:underline">
                      <h3 className="text-lg font-semibold flex items-center gap-1.5 text-foreground">
                        {company.name}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground">{company.industry}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize">
                    {TIER_LABEL[company.tier]}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Size</dt>
                    <dd className="font-medium uppercase">{company.size}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Contacts</dt>
                    <dd className="font-medium">{contactCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Website</dt>
                    <dd className="truncate font-medium">{company.website.replace("https://", "")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Owner</dt>
                    <dd className="font-medium">
                      {owner ? `${owner.firstName} ${owner.lastName}` : "Unassigned"}
                    </dd>
                  </div>
                </dl>
                <div className="pt-2 border-t border-border mt-auto flex justify-end">
                  <Link to={`/companies/${company.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground hover:text-foreground">
                      View Details
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
