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
import { knowledgeService } from "@/lib/services/knowledge.service";
import { usersService } from "@/lib/services/users.service";

export const Route = createFileRoute("/_authenticated/knowledge/new")({
  head: () => ({ meta: [{ title: "New Runbook — Northwind CRM" }] }),
  component: NewKnowledgePage,
});

function NewKnowledgePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const users = useStore(() => usersService.list().filter((u) => u.status === "active"));

  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"draft" | "executed" | "archived">("draft");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [assignedUserId, setAssignedUserId] = useState(user?.id ?? "");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot precede start date.");
      return;
    }
    if (!assignedUserId) {
      setError("Please assign a runbook owner.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      knowledgeService.create({
        subject,
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        assignedUserId,
        tags,
      });
      navigate({ to: "/knowledge" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create knowledge item.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/knowledge" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title="New Runbook / Article"
        description="Add a new resolution runbook or knowledge item to the library."
      />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Subject / Title *</label>
          <Input
            placeholder="e.g. Setting up AWS Aurora replication lag alerts"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="rounded-full border-border bg-surface"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="rounded-full border-border bg-surface h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="rounded-full border-border bg-surface h-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned Owner *</label>
            <Select value={assignedUserId} onValueChange={setAssignedUserId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder="Select Owner" />
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
          <label className="text-sm font-medium">Tags (comma-separated)</label>
          <Input
            placeholder="e.g. aws, aurora, databases, alert"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="rounded-full border-border bg-surface"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => navigate({ to: "/knowledge" })}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full">
            <Save className="mr-1.5 h-4 w-4" /> Save Item
          </Button>
        </div>
      </form>
    </div>
  );
}
