import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  CircleUser,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/routes";
import { notificationsService } from "@/lib/services/notifications.service";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  visible: boolean;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, can } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const navigation: NavItem[] = useMemo(
    () => [
      { to: ROUTES.dashboard.path, label: "Journeys", icon: <LayoutDashboard className="h-5 w-5" />, visible: can("journeys.read") },
      { to: ROUTES.companies.path, label: "Companies", icon: <Building2 className="h-5 w-5" />, visible: can("companies.read") },
      { to: ROUTES.contacts.path, label: "Contacts", icon: <Briefcase className="h-5 w-5" />, visible: can("contacts.read") },
      { to: ROUTES.tasks.path, label: "Tasks", icon: <ListChecks className="h-5 w-5" />, visible: can("tasks.read") },
      { to: ROUTES.knowledge.path, label: "Knowledge", icon: <Calendar className="h-5 w-5" />, visible: can("knowledge.read") },
      { to: ROUTES.adminUsers.path, label: "Users", icon: <Users className="h-5 w-5" />, visible: can("users.read") },
      { to: ROUTES.settings.path, label: "Settings", icon: <Settings className="h-5 w-5" />, visible: can("settings.write") },
    ],
    [can],
  );

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Compact icon rail */}
      <aside className="hidden w-[72px] flex-col items-center justify-between border-r border-border bg-sidebar py-6 lg:flex">
        <div className="flex flex-col items-center gap-2">
          <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </Link>
          <div className="mt-4 flex flex-col gap-1">
            <RailButton icon={<ChevronLeft className="h-4 w-4" />} />
            <RailButton icon={<Send className="h-4 w-4" />} />
            <RailButton icon={<Plus className="h-4 w-4" />} />
            <RailButton icon={<Bell className="h-4 w-4" />} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <RailButton
            icon={theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          />
          <Link to={ROUTES.profile.path} className="grid h-10 w-10 place-items-center rounded-full">
            <UserAvatar initials={user.initials} color={user.avatarColor} size="md" />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar pathname={pathname} navigation={navigation} onLogout={logout} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 pb-12 pt-2 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function RailButton({ icon, onClick }: { icon: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      {icon}
    </button>
  );
}

function TopBar({
  pathname,
  navigation,
  onLogout,
}: {
  pathname: string;
  navigation: NavItem[];
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const unread = useStore(() => (user ? notificationsService.unreadCount(user.id) : 0));
  const notifications = useStore(() => (user ? notificationsService.forUser(user.id).slice(0, 6) : []));
  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-6 py-4 lg:px-10">
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {navigation
            .filter((n) => n.visible)
            .map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.icon}</span>
                </Link>
              );
            })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases, contacts, knowledge…"
              className="h-10 w-72 rounded-full border-border bg-surface pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground transition hover:text-foreground">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <button
                  className="text-xs font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => notificationsService.markAllRead(user.id)}
                >
                  Mark all read
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-left">
                <UserAvatar initials={user.initials} color={user.avatarColor} size="sm" />
                <span className="hidden text-sm font-medium lg:inline">
                  {user.firstName} {user.lastName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={ROUTES.profile.path} className="flex items-center gap-2">
                  <CircleUser className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="hidden h-10 rounded-full px-4 md:inline-flex">
            <Plus className="mr-1.5 h-4 w-4" /> New case
          </Button>
        </div>
      </div>
    </header>
  );
}
