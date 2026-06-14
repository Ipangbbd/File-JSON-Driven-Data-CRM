import { Link, createFileRoute } from "@tanstack/react-router";
import { Calendar, Plus, Share2 } from "lucide-react";

import { JourneyBoard } from "@/components/crm/JourneyBoard";
import { PageHeader } from "@/components/crm/PageHeader";
import { JourneyStatusBadge, PriorityBadge } from "@/components/crm/StatusBadges";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { journeysService } from "@/lib/services/journeys.service";
import { knowledgeService } from "@/lib/services/knowledge.service";
import { tasksService } from "@/lib/services/tasks.service";
import { usersService } from "@/lib/services/users.service";
import { formatDate } from "@/lib/format";
import type { Task } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Customer Journeys — Northwind CRM" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const boards = useStore(() => journeysService.boards());
  const knowledge = useStore(() => knowledgeService.suggestionsFor());
  const tasks = useStore(() => tasksService.list());
  const users = useStore(() => usersService.list());
  const companies = useStore(() => companiesService.list());

  const primary = boards[0];
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const ticketCounts = boards.reduce(
    (acc, board) => {
      const total = board.stages.reduce((sum, s) => sum + s.tasks.length, 0);
      const done = total - board.openTaskCount;
      acc.total += total;
      acc.done += done;
      acc.active += board.journey.status === "active" ? 1 : 0;
      return acc;
    },
    { total: 0, done: 0, active: 0 },
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Journeys"
        description="Workflow workspace across every active customer case journey."
        actions={
          <>
            <Button variant="outline" className="h-10 rounded-full px-4">
              <Share2 className="mr-1.5 h-4 w-4" /> Share view
            </Button>
            <Link to="/journeys/new">
              <Button className="h-10 rounded-full px-4">
                <Plus className="mr-1.5 h-4 w-4" /> New journey
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active journeys" value={ticketCounts.active.toString()} hint={`${boards.length} total`} />
        <StatCard
          label="Tasks completed"
          value={`${ticketCounts.done}/${ticketCounts.total}`}
          hint="Across every case"
        />
        <StatCard
          label="Open workload"
          value={(ticketCounts.total - ticketCounts.done).toString()}
          hint="Tasks awaiting action"
        />
      </div>

      {primary && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Primary Board</span>
            <Link to={`/journeys/${primary.journey.id}`}>
              <Button variant="ghost" size="sm" className="rounded-full text-xs">
                Open Workspace →
              </Button>
            </Link>
          </div>
          <JourneyBoard journeyId={primary.journey.id} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="surface-card lg:col-span-3">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold">Suggested Knowledge</h3>
              <p className="text-xs text-muted-foreground">Runbooks aligned to your open cases.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Share2 className="h-4 w-4" /></button>
              <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Calendar className="h-4 w-4" /></button>
            </div>
          </header>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Start</th>
                <th className="px-6 py-3 font-medium">End</th>
                <th className="px-6 py-3 font-medium">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {knowledge.map((item) => {
                const owner = userById.get(item.assignedUserId);
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-6 py-3 font-medium">
                      <Link to={`/knowledge/${item.id}`} className="hover:underline text-foreground">
                        {item.subject}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(item.startDate)}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(item.endDate)}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {owner ? `${owner.firstName} ${owner.lastName}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="surface-card flex flex-col gap-4 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Support Ticket Journey</h3>
            <span className="text-xs text-muted-foreground">
              Health across all active cases
            </span>
          </div>
          <div className="flex flex-1 items-center justify-around">
            <DonutStat color="oklch(0.66 0.15 252)" label="Executed" value={ticketCounts.done} />
            <DonutStat
              color="oklch(0.6 0.21 26)"
              label="Active"
              value={ticketCounts.total - ticketCounts.done}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Executed tasks</div>
            <div className="text-right text-foreground">{ticketCounts.done}</div>
            <div>Active tasks</div>
            <div className="text-right text-foreground">{ticketCounts.total - ticketCounts.done}</div>
          </div>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold">All journeys</h3>
        </header>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Reference</th>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Owner</th>
              <th className="px-6 py-3 font-medium">Priority</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Open tasks</th>
            </tr>
          </thead>
          <tbody>
            {boards.map(({ journey, openTaskCount }) => {
              const company = companyById.get(journey.companyId);
              const owner = userById.get(journey.ownerId);
              return (
                <tr key={journey.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                    <Link to={`/journeys/${journey.id}`} className="text-primary hover:underline font-semibold">
                      {journey.reference}
                    </Link>
                  </td>
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/journeys/${journey.id}`} className="hover:underline text-foreground">
                      {journey.title}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {company ? (
                      <Link to={`/companies/${company.id}`} className="hover:underline text-muted-foreground">
                        {company.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {owner ? `${owner.firstName} ${owner.lastName}` : "—"}
                  </td>
                  <td className="px-6 py-3"><PriorityBadge priority={journey.priority} /></td>
                  <td className="px-6 py-3"><JourneyStatusBadge status={journey.status} /></td>
                  <td className="px-6 py-3 text-muted-foreground">{openTaskCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <NextUpSection tasks={tasks} />
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface-card p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function DonutStat({ color, label, value }: { color: string; label: string; value: number }) {
  const angle = Math.min(360, Math.max(0, value * 22));
  const style: React.CSSProperties = {
    background: `conic-gradient(${color} ${angle}deg, oklch(0.95 0.012 270) 0deg)`,
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-32 w-32 place-items-center rounded-full" style={style}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-surface text-xl font-semibold">
          {value}
        </div>
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function NextUpSection({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks.filter((t) => t.status !== "completed").slice(0, 6);
  return (
    <section className="surface-card p-6">
      <h3 className="text-base font-semibold">Next up</h3>
      <p className="text-xs text-muted-foreground">Tasks ordered by closest due date.</p>
      <ul className="mt-4 divide-y divide-border">
        {upcoming.map((task) => (
          <li key={task.id} className="flex items-center justify-between py-3 text-sm">
            <Link to={`/tasks/${task.id}`} className="font-medium hover:underline text-foreground">
              {task.title}
            </Link>
            <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
