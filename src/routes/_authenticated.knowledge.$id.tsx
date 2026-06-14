import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Edit2, Save, Trash2, X } from "lucide-react";

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
import { useStore } from "@/lib/providers/DataProvider";
import { knowledgeService } from "@/lib/services/knowledge.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/knowledge/$id")({
  head: () => ({ meta: [{ title: `Knowledge Item Details — Northwind CRM` }] }),
  component: KnowledgeDetailPage,
});

function KnowledgeDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const item = useStore(() => knowledgeService.byId(id));
  const users = useStore(() => usersService.list());

  const activeUsers = users.filter((u) => u.status === "active");
  const userById = new Map(users.map((u) => [u.id, u]));

  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"draft" | "executed" | "archived">("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!item) {
    return (
      <div className="surface-card p-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Knowledge item not found</h2>
        <Button onClick={() => navigate({ to: "/knowledge" })} className="rounded-full">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const startEdit = () => {
    setSubject(item.subject);
    setStatus(item.status);
    setStartDate(item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "");
    setEndDate(item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "");
    setAssignedUserId(item.assignedUserId);
    setTagsInput(item.tags.join(", "));
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
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
      knowledgeService.update(item.id, {
        subject,
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        assignedUserId,
        tags,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update knowledge item.");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this knowledge item? This cannot be undone.")) {
      try {
        knowledgeService.delete(item.id);
        navigate({ to: "/knowledge" });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot delete knowledge item.");
      }
    }
  };

  const owner = userById.get(item.assignedUserId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/knowledge" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Knowledge Base
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
        title={item.subject}
        description={`Runbook ID: ${item.id}`}
        meta={
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize mt-2 inline-block">
            {item.status}
          </span>
        }
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Attributes Sidebar */}
        <section className="surface-card p-6 md:col-span-1 space-y-4 text-sm">
          <h3 className="text-base font-semibold border-b border-border pb-2">Runbook Metadata</h3>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Subject</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="executed">Executed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Owner</label>
                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-full h-8" />
              </div>
            </div>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd className="font-medium pt-1">
                  {owner ? `${owner.firstName} ${owner.lastName}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Start Date</dt>
                <dd className="font-medium pt-1">{formatDate(item.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">End Date</dt>
                <dd className="font-medium pt-1">{formatDate(item.endDate)}</dd>
              </div>
            </dl>
          )}
        </section>

        {/* Tags and content */}
        <section className="surface-card p-6 md:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-semibold border-b border-border pb-2">Topic Tags</h3>
            {isEditing ? (
              <div className="pt-2">
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. database, backup, recovery"
                  className="rounded-full"
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-2">Separate tags with commas.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {item.tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No tags set.</span>
                ) : (
                  item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      #{tag}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold border-b border-border pb-2">Linked Resolution Process</h3>
            <p className="text-sm text-muted-foreground pt-3 leading-relaxed">
              This runbook defines the recommended procedures and checkpoints associated with executing resolutions of this category.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
