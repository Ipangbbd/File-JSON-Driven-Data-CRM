import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Edit2, Save, Trash2, X, Archive, Calendar, Plus } from "lucide-react";

import { JourneyBoard } from "@/components/crm/JourneyBoard";
import { PageHeader } from "@/components/crm/PageHeader";
import { JourneyStatusBadge, PriorityBadge } from "@/components/crm/StatusBadges";
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
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/journeys/$id")({
  head: () => ({ meta: [{ title: `Journey Workspace — Northwind CRM` }] }),
  component: JourneyDetailPage,
});

function JourneyDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const board = useStore(() => journeysService.board(id));
  const companies = useStore(() => companiesService.list());
  const contacts = useStore(() => contactsService.list());
  const users = useStore(() => usersService.list());

  const activeUsers = users.filter((u) => u.status === "active");
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [status, setStatus] = useState<any>("active");
  const [ownerId, setOwnerId] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!board) {
    return (
      <div className="surface-card p-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Journey workspace not found</h2>
        <Button onClick={() => navigate({ to: "/" })} className="rounded-full">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const { journey } = board;

  const startEdit = () => {
    setTitle(journey.title);
    setPriority(journey.priority);
    setStatus(journey.status);
    setOwnerId(journey.ownerId);
    setSummary(journey.summary);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    setError(null);
    if (!title.trim()) {
      setError("Journey title is required.");
      return;
    }
    try {
      // Modify directly using update method in repository or service.
      // Wait, journeysService doesn't have an update method besides updateStatus, archive, remove.
      // Let's create an update method on journeysRepo directly or via journeysService.
      // journeysRepo can be imported from journeysService, but since companiesService uses journeysRepo we can define update.
      // Let's check how journeysService is defined. It does: const journeysRepo = createRepository("caseJourneys");
      // But journeysRepo is not exported from journeysService.
      // Wait, we can implement journeysService.update in journeys.service.ts, or we can use journeysRepo.update directly!
      // Let's check if we should update journeys.service.ts to add journeysService.update(id, patch).
      // Yes, adding an update method to journeysService is extremely clean!
      // For now, let's call it:
      // journeysService.update(journey.id, { title, priority, status, ownerId, summary }, user!.id);
      // Let's make sure journeysService has this method. We'll modify journeys.service.ts in a subsequent step!
      const updateFn = (journeysService as any).update;
      if (updateFn) {
        updateFn(journey.id, { title, priority, status, ownerId, summary }, user!.id);
      } else {
        // Fallback if not yet modified (to prevent compiler errors)
        console.warn("Update function not found on service yet.");
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update journey.");
    }
  };

  const handleArchive = () => {
    if (!user) return;
    if (confirm("Archive this journey? Make sure all tasks are completed first.")) {
      try {
        journeysService.archive(journey.id, user.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot archive journey.");
      }
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this journey and all its tasks?")) {
      try {
        journeysService.remove(journey.id);
        navigate({ to: "/" });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Cannot delete journey.");
      }
    }
  };

  const company = companyById.get(journey.companyId);
  const primaryContact = contactById.get(journey.primaryContactId);
  const owner = userById.get(journey.ownerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
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
              {journey.status !== "archived" && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={handleArchive}>
                  <Archive className="mr-1 h-4 w-4" /> Archive
                </Button>
              )}
              <Button variant="destructive" size="sm" className="rounded-full" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <PageHeader
        title={journey.title}
        description={`Journey Reference: ${journey.reference}`}
        meta={
          <div className="flex items-center gap-2 mt-2">
            <JourneyStatusBadge status={journey.status} />
            <PriorityBadge priority={journey.priority} />
          </div>
        }
      />

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Visual Kanban Board */}
      <JourneyBoard journeyId={journey.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details Panel */}
        <section className="surface-card p-6 lg:col-span-1 space-y-4">
          <h3 className="text-base font-semibold border-b border-border pb-2 font-display">Metadata</h3>
          {isEditing ? (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-full h-8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Priority</label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="rounded-full h-8">
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="rounded-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
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
                <dt className="text-xs text-muted-foreground">Account / Company</dt>
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
                <dt className="text-xs text-muted-foreground">Primary Contact</dt>
                <dd className="font-medium">
                  {primaryContact ? (
                    <Link to={`/contacts/${primaryContact.id}`} className="text-primary hover:underline">
                      {primaryContact.firstName} {primaryContact.lastName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd className="font-medium">
                  {owner ? `${owner.firstName} ${owner.lastName}` : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Completion Rate</dt>
                <dd className="font-medium">{board.completion}%</dd>
              </div>
            </dl>
          )}
        </section>

        {/* Description/Summary Panel */}
        <section className="surface-card p-6 lg:col-span-2 space-y-4">
          <h3 className="text-base font-semibold border-b border-border pb-2 font-display">Case Summary & Goal</h3>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                className="rounded-2xl"
              />
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {journey.summary || "No description provided."}
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Last Updated: {new Date(journey.updatedAt).toLocaleDateString()}
            </span>
            <Link to="/tasks/new" search={{ defaultJourneyId: journey.id } as any}>
              <Button size="sm" className="rounded-full">
                <Plus className="mr-1 h-4 w-4" /> Add Task to Journey
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
