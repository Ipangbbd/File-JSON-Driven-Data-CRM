import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { usersService } from "@/lib/services/users.service";
import { formatDateTime } from "@/lib/format";
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Northwind CRM" }] }),
  component: UsersAdminPage,
});

function UsersAdminPage() {
  const { user: current, can } = useAuth();
  const navigate = useNavigate();
  const users = useStore(() => usersService.list());

  useEffect(() => {
    if (!can("users.read")) navigate({ to: "/" });
  }, [can, navigate]);

  const editable = can("users.write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Provision, govern and audit internal user access."
      />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Member</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Workload</th>
              <th className="px-6 py-3 font-medium">Last login</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const workload = usersService.workload(u.id);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar initials={u.initials} color={u.avatarColor} imageSrc={u.avatarImage} size="sm" />
                      <div>
                        <div className="font-medium">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {editable && current?.id !== u.id ? (
                      <Select
                        defaultValue={u.role}
                        onValueChange={(value) => {
                          try {
                            usersService.updateRole(u.id, value as UserRole);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Unable to update role.");
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">{ROLE_LABELS[u.role]}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                        u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {workload.open} open · {workload.completed} done
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{formatDateTime(u.lastLoginAt)}</td>
                  <td className="px-6 py-3 text-right">
                    {editable && current?.id !== u.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          if (u.status === "active") usersService.suspend(u.id);
                          else usersService.reactivate(u.id);
                        }}
                      >
                        {u.status === "active" ? "Suspend" : "Reactivate"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
