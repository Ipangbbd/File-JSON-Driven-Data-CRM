import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const searchSchema = z.object({
  defaultCompanyId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/journeys/new")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "New Journey — Northwind CRM" }] }),
  component: NewJourneyPage,
});

function NewJourneyPage() {
  const { defaultCompanyId } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const companies = useStore(() => companiesService.list());
  const contacts = useStore(() => contactsService.list());
  const journeys = useStore(() => journeysService.list());
  const users = useStore(() => usersService.list().filter((u) => u.status === "active"));

  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [primaryContactId, setPrimaryContactId] = useState("");
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Generate Reference code on mount or when journeys load
  useEffect(() => {
    const num = 100 + journeys.length + 1;
    setReference(`JRN-${num}`);
  }, [journeys]);

  // Filter contacts by selected company
  const filteredContacts = contacts.filter((c) => c.companyId === companyId);

  // Auto-select first contact when company changes
  useEffect(() => {
    if (filteredContacts.length > 0) {
      setPrimaryContactId(filteredContacts[0].id);
    } else {
      setPrimaryContactId("");
    }
  }, [companyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Journey title is required.");
      return;
    }
    if (!companyId) {
      setError("Please select a company.");
      return;
    }
    if (!primaryContactId) {
      setError("Please select a primary contact for this company.");
      return;
    }
    if (!ownerId) {
      setError("Please assign a journey owner.");
      return;
    }

    try {
      const newJourney = journeysService.create(
        {
          title,
          reference,
          companyId,
          primaryContactId,
          ownerId,
          priority,
          summary: summary || "Workflow case journey.",
        },
        user?.id ?? "system"
      );
      navigate({ to: `/journeys/${newJourney.id}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create journey.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            if (defaultCompanyId) {
              navigate({ to: `/companies/${defaultCompanyId}` });
            } else {
              navigate({ to: "/" });
            }
          }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title="New Case Journey"
        description="Initiate a new structured lifecycle track for a customer ticket or project."
      />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Journey Title *</label>
            <Input
              placeholder="e.g. Upgrade Database Cluster"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-full border-border bg-surface"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Code</label>
            <Input
              placeholder="e.g. JRN-101"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className="rounded-full border-border bg-surface font-mono text-xs"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Account *</label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder="Select Company" />
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Contact *</label>
            <Select
              value={primaryContactId}
              onValueChange={setPrimaryContactId}
              disabled={!companyId || filteredContacts.length === 0}
            >
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder={companyId ? "Select Contact" : "Select Company First"} />
              </SelectTrigger>
              <SelectContent>
                {filteredContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned Owner *</label>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Case Summary</label>
          <Textarea
            placeholder="Detailed description of the workflow requirements..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="rounded-2xl border-border bg-surface"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (defaultCompanyId) {
                navigate({ to: `/companies/${defaultCompanyId}` });
              } else {
                navigate({ to: "/" });
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full">
            <Save className="mr-1.5 h-4 w-4" /> Start Journey
          </Button>
        </div>
      </form>
    </div>
  );
}
