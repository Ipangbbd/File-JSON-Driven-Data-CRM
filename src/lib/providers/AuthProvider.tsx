import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { useDataContext } from "@/lib/providers/DataProvider";
import { authService, type LoginInput } from "@/lib/services/auth.service";
import { hasPermission, permissionsFor } from "@/lib/auth/permissions";
import type { Permission, User } from "@/lib/types";

interface AuthContextValue {
  status: "initializing" | "authenticated" | "unauthenticated";
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  permissions: readonly Permission[];
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready } = useDataContext();
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const restored = authService.restore();
    setUser(restored?.user ?? null);
    setInitialized(true);
  }, [ready]);

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const { user: nextUser } = authService.login({ email, password });
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    const restored = authService.restore();
    setUser(restored?.user ?? null);
  }, []);

  const can = useCallback(
    (permission: Permission) => (user ? hasPermission(user.role, permission) : false),
    [user],
  );

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthContextValue["status"] = !initialized
      ? "initializing"
      : user
        ? "authenticated"
        : "unauthenticated";
    return {
      status,
      user,
      login,
      logout,
      can,
      permissions: user ? permissionsFor(user.role) : [],
      refreshUser,
    };
  }, [initialized, user, login, logout, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider.");
  return ctx;
}
