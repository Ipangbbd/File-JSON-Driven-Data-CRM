import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Plus, Eye } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Northwind CRM" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/contacts";
  const contacts = useStore(() => contactsService.list());
  const companies = useStore(() => companiesService.list());
  const companyById = new Map(companies.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People associated with your customer accounts."
        actions={
          <Link to="/contacts/new">
            <Button className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> New contact
            </Button>
          </Link>
        }
      />

      {isRoot && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const company = companyById.get(contact.companyId);
                return (
                  <tr key={contact.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-6 py-3">
                      <Link to={`/contacts/${contact.id}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            initials={`${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`}
                            color={contact.avatarColor}
                            size="sm"
                          />
                          <span className="font-medium text-foreground">
                            {contact.firstName} {contact.lastName}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{contact.role}</td>
                    <td className="px-6 py-3">
                      {company ? (
                        <Link to={`/companies/${company.id}`} className="text-primary hover:underline">
                          {company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{contact.email}</td>
                    <td className="px-6 py-3 text-muted-foreground">{contact.phone}</td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/contacts/${contact.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Outlet />
    </div>
  );
}
