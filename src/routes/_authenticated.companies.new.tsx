import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

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
import { usersService } from "@/lib/services/users.service";

export const Route = createFileRoute("/_authenticated/companies/new")({
  head: () => ({ meta: [{ title: "New Company — Northwind CRM" }] }),
  component: NewCompanyPage,
});

function NewCompanyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const users = useStore(() => usersService.list().filter((u) => u.status === "active"));

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState<"smb" | "mid" | "enterprise">("smb");
  const [website, setWebsite] = useState("");
  const [tier, setTier] = useState<"standard" | "priority" | "strategic">("standard");
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      companiesService.create({
        name,
        industry: industry || "General",
        size,
        website: website || "https://",
        tier,
        ownerId,
      });
      navigate({ to: "/companies" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create company.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/companies" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title="New Company"
        description="Add a new customer account to the CRM."
      />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Company Name *</label>
          <Input
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-full border-border bg-surface"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Input
              placeholder="e.g. Technology, Retail"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-full border-border bg-surface"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              placeholder="e.g. www.acme.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded-full border-border bg-surface"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Size</label>
            <Select value={size} onValueChange={(val: any) => setSize(val)}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smb">SMB</SelectItem>
                <SelectItem value="mid">Mid-Market</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tier</label>
            <Select value={tier} onValueChange={(val: any) => setTier(val)}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account Owner</label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => navigate({ to: "/companies" })}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full">
            <Save className="mr-1.5 h-4 w-4" /> Save Company
          </Button>
        </div>
      </form>
    </div>
  );
}
