import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Edit2, Save, Trash2, X, Plus } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";
import { journeysService } from "@/lib/services/journeys.service";
import { usersService } from "@/lib/services/users.service";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: ({ params }) => ({ meta: [{ title: `Company Details — Northwind CRM` }] }),
  component: CompanyDetailPage,
});

const TIER_LABEL: Record<string, string> = {
  standard: "Standard",
  priority: "Priority",
  strategic: "Strategic",
};

function CompanyDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const company = useStore(() => companiesService.byId(id));
  const contacts = useStore(() => contactsService.list().filter((c) => c.companyId === id));
  const journeys = useStore(() => journeysService.list().filter((j) => j.companyId === id));
  const users = useStore(() => usersService.list());

  const activeUsers = users.filter((u) => u.status === "active");
  const userById = new Map(users.map((u) => [u.id, u]));

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState<"smb" | "mid" | "enterprise">("smb");
  const [website, setWebsite] = useState("");
  const [tier, setTier] = useState<"standard" | "priority" | "strategic">("standard");
  const [ownerId, setOwnerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!company) {
    return (
      <div className="surface-card p-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Company not found</h2>
        <Button onClick={() => navigate({ to: "/companies" })} className="rounded-full">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Companies
        </Button>
      </div>
    );
  }

  const startEdit = () => {
    setName(company.name);
    setIndustry(company.industry);
    setSize(company.size);
    setWebsite(company.website);
    setTier(company.tier);
    setOwnerId(company.ownerId);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    setError(null);
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    try {
      companiesService.update(company.id, {
        name,
        industry,
        size,
        website,
        tier,
        ownerId,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update company.");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      try {
        companiesService.delete(company.id);
        navigate({ to: "/companies" });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot delete company.");
      }
    }
  };

  const owner = userById.get(company.ownerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/companies" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Companies
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditing(false)}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" className="rounded-full" onClick={handleSave}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="rounded-full" onClick={startEdit}>
                <Edit2 className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" className="rounded-full" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <PageHeader
        title={company.name}
        description={`${company.industry} · ${TIER_LABEL[company.tier]} Account`}
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company profile panel */}
        <section className="surface-card p-6 lg:col-span-1 space-y-4">
          <h3 className="text-base font-semibold border-b border-border pb-2">Account Overview</h3>
          {isEditing ? (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Industry</label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Website</label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Size</label>
                <Select value={size} onValueChange={(val: any) => setSize(val)}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smb">SMB</SelectItem>
                    <SelectItem value="mid">Mid-Market</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Tier</label>
                <Select value={tier} onValueChange={(val: any) => setTier(val)}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Owner</label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Industry</dt>
                <dd className="font-medium">{company.industry}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Size</dt>
                <dd className="font-medium uppercase">{company.size}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Website</dt>
                <dd className="font-medium truncate">
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {company.website.replace("https://", "").replace("http://", "")}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tier</dt>
                <dd className="font-medium capitalize">{TIER_LABEL[company.tier]}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Account Owner</dt>
                <dd className="font-medium">
                  {owner ? `${owner.firstName} ${owner.lastName}` : "Unassigned"}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Company relationships */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Contacts */}
          <section className="surface-card overflow-hidden">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-semibold">Contacts ({contacts.length})</h3>
                <p className="text-xs text-muted-foreground">People linked to this account.</p>
              </div>
              <Link to="/contacts/new" search={{ defaultCompanyId: company.id } as any}>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Contact
                </Button>
              </Link>
            </header>
            {contacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No contacts linked yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-6 py-3 font-medium">
                        <Link to={`/contacts/${contact.id}`} className="hover:underline text-foreground">
                          {contact.firstName} {contact.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{contact.role}</td>
                      <td className="px-6 py-3 text-muted-foreground">{contact.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Associated Journeys */}
          <section className="surface-card overflow-hidden">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-semibold">Active Journeys ({journeys.length})</h3>
                <p className="text-xs text-muted-foreground">Case workflows and status tracks.</p>
              </div>
              <Link to="/journeys/new" search={{ defaultCompanyId: company.id } as any}>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Plus className="mr-1 h-3.5 w-3.5" /> New Journey
                </Button>
              </Link>
            </header>
            {journeys.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No active journeys.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 font-medium">Reference</th>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Priority</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {journeys.map((journey) => (
                    <tr key={journey.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {journey.reference}
                      </td>
                      <td className="px-6 py-3 font-medium">
                        <Link to={`/journeys/${journey.id}`} className="hover:underline text-foreground">
                          {journey.title}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground capitalize">{journey.priority}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs capitalize font-medium">
                          {journey.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
