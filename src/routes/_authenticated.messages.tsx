import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/providers/DataProvider";
import { usersService } from "@/lib/services/users.service";
import { messagesService } from "@/lib/services/messages.service";
import { useAuth } from "@/lib/providers/AuthProvider";
import { UserAvatar } from "@/components/crm/UserAvatar";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Northwind CRM" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const users = useStore(() => usersService.list().filter((u) => u.status === "active"));

  const otherUsers = useMemo(() => users.filter((u) => u.id !== user?.id), [users, user]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => otherUsers[0]?.id ?? null);
  const [body, setBody] = useState("");

  // Refresh thread when selected changes
  const thread = useStore(() => (user && selectedUserId ? messagesService.listBetween(user.id, selectedUserId) : []));

  useEffect(() => {
    if (user && selectedUserId) {
      // mark messages addressed to current user as read
      messagesService.markReadBetween(user.id, selectedUserId);
    }
  }, [user, selectedUserId]);

  const send = () => {
    if (!selectedUserId || !body.trim() || !user) return;
    messagesService.create({ fromId: user.id, toId: selectedUserId, body: body.trim() });
    setBody("");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Chat one-to-one with other workspace users." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <aside className="col-span-1">
          <div className="surface-card rounded-lg p-4">
            <h4 className="text-sm font-semibold">Users</h4>
            <ul className="mt-3 space-y-2">
              {otherUsers.map((u) => {
                const unread = user ? messagesService.unreadCountBetween(user.id, u.id) : 0;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-secondary ${selectedUserId === u.id ? 'bg-secondary' : ''}`}
                    >
                      <UserAvatar initials={u.initials} color={u.avatarColor} imageSrc={u.avatarImage} size="sm" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.jobTitle}</div>
                      </div>
                      {unread > 0 && (
                        <div className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">{unread}</div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section className="col-span-3">
          <div className="surface-card rounded-lg p-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                {selectedUserId ? (
                  (() => {
                    const other = users.find((u) => u.id === selectedUserId)!;
                    return (
                      <>
                        <UserAvatar initials={other.initials} color={other.avatarColor} imageSrc={other.avatarImage} size="sm" />
                        <div className="text-sm font-medium">{other.firstName} {other.lastName}</div>
                      </>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground">Select a user to start chatting</div>
                )}
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 px-2 py-2">
              {thread.length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages yet. Say hello!</div>
              ) : (
                thread.map((m) => {
                  const fromMe = m.fromId === user.id;
                  const other = users.find((u) => u.id === (fromMe ? m.toId : m.fromId));
                  return (
                    <div key={m.id} className={`flex gap-3 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                      {!fromMe && (
                        <UserAvatar initials={other?.initials ?? '??'} color={other?.avatarColor} imageSrc={other?.avatarImage} size="sm" />
                      )}
                      <div className={`${fromMe ? 'bg-primary text-primary-foreground' : 'bg-surface'} max-w-[70%] rounded-lg p-3 text-sm`}>{m.body}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder={selectedUserId ? 'Write a message...' : 'Select a user to message'} className="flex-1" />
              <Button onClick={send} disabled={!selectedUserId || !body.trim()} className="rounded-full">Send</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
