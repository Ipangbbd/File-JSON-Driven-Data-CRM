import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Northwind CRM" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const contacts = useStore(() => contactsService.list());
  const companies = useStore(() => companiesService.list());
  const companyById = new Map(companies.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People associated with your customer accounts."
      />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const company = companyById.get(contact.companyId);
              return (
                <tr key={contact.id} className="border-t border-border">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        initials={`${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`}
                        color={contact.avatarColor}
                        size="sm"
                      />
                      <span className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{contact.role}</td>
                  <td className="px-6 py-3 text-muted-foreground">{company?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{contact.email}</td>
                  <td className="px-6 py-3 text-muted-foreground">{contact.phone}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
