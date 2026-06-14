import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Edit2, Save, Trash2, X } from "lucide-react";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/contacts/$id")({
  head: () => ({ meta: [{ title: `Contact Details — Northwind CRM` }] }),
  component: ContactDetailPage,
});

const AVATAR_COLORS = ["blue", "emerald", "violet", "rose", "amber", "cyan", "fuchsia"];

function ContactDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const contact = useStore(() => contactsService.byId(id));
  const companies = useStore(() => companiesService.list());
  const companyById = new Map(companies.map((c) => [c.id, c]));

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [avatarColor, setAvatarColor] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!contact) {
    return (
      <div className="surface-card p-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Contact not found</h2>
        <Button onClick={() => navigate({ to: "/contacts" })} className="rounded-full">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  const startEdit = () => {
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setEmail(contact.email);
    setPhone(contact.phone);
    setRole(contact.role);
    setCompanyId(contact.companyId);
    setAvatarColor(contact.avatarColor);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and Last name are required.");
      return;
    }
    if (!companyId) {
      setError("Please select a company.");
      return;
    }
    if (!email.includes("@")) {
      setError("A valid email is required.");
      return;
    }

    try {
      contactsService.update(contact.id, {
        firstName,
        lastName,
        email,
        phone,
        role,
        companyId,
        avatarColor,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update contact.");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
      try {
        contactsService.delete(contact.id);
        navigate({ to: "/contacts" });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot delete contact.");
      }
    }
  };

  const company = companyById.get(contact.companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/contacts" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Contacts
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
        title={`${contact.firstName} ${contact.lastName}`}
        description={`${contact.role} at ${company?.name ?? "Unknown Company"}`}
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="surface-card p-6 md:col-span-1 flex flex-col items-center text-center space-y-4">
          <UserAvatar
            initials={`${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`}
            color={contact.avatarColor}
            size="lg"
          />
          <div>
            <h3 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h3>
            <p className="text-sm text-muted-foreground">{contact.role}</p>
          </div>
          {company && (
            <div className="text-sm font-medium pt-2 border-t border-border w-full">
              <Link to={`/companies/${company.id}`} className="text-primary hover:underline">
                {company.name}
              </Link>
            </div>
          )}
        </section>

        <section className="surface-card p-6 md:col-span-2 space-y-4">
          <h3 className="text-base font-semibold border-b border-border pb-2">Contact Details</h3>
          {isEditing ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-full h-8" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-full h-8" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-full h-8" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-full h-8" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Company</label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="rounded-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Role</label>
                  <Input value={role} onChange={(e) => setRole(e.target.value)} className="rounded-full h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Avatar Color</label>
                <div className="flex gap-1.5 pt-1">
                  {AVATAR_COLORS.map((color) => {
                    const bgMap: Record<string, string> = {
                      blue: "bg-blue-500",
                      emerald: "bg-emerald-500",
                      violet: "bg-violet-500",
                      rose: "bg-rose-500",
                      amber: "bg-amber-500",
                      cyan: "bg-cyan-500",
                      fuchsia: "bg-fuchsia-500",
                    };
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        className={`h-6 w-6 rounded-full ${bgMap[color] || "bg-gray-500"} transition-all ${
                          avatarColor === color ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{contact.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium text-foreground">{contact.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Company</dt>
                <dd className="font-medium">
                  {company ? (
                    <Link to={`/companies/${company.id}`} className="text-primary hover:underline">
                      {company.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="font-medium text-foreground">{contact.role}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
