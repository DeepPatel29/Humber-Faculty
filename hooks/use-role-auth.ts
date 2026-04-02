"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type UserRole,
  type Permission,
  hasPermission,
  ROLES,
} from "@/lib/types/roles";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  facultyId?: string;
}

interface RoleAuthType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  isFaculty: boolean;
  isAdmin: boolean;
  isScheduler: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

let cachedUser: AuthUser | null | undefined = undefined;
let fetchingPromise: Promise<AuthUser | null> | null = null;

async function fetchSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/get-session", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.user) {
      return {
        id: data.user.id,
        name: data.user.name || "User",
        email: data.user.email || "",
        role: (data.user.role as UserRole) || ROLES.STAFF,
        image: data.user.image || undefined,
        facultyId: data.user.facultyId || undefined,
      };
    }
    if (data?.session?.userId) {
      return {
        id: data.session.userId,
        name: data.user?.name || "User",
        email: data.user?.email || "",
        role: (data.user?.role as UserRole) || ROLES.STAFF,
        image: data.user?.image || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function useRoleAuth(): RoleAuthType {
  const [user, setUser] = useState<AuthUser | null>(cachedUser ?? null);
  const [isLoading, setIsLoading] = useState(cachedUser === undefined);

  useEffect(() => {
    if (cachedUser !== undefined) {
      setUser(cachedUser);
      setIsLoading(false);
      return;
    }
    if (!fetchingPromise) {
      fetchingPromise = fetchSessionUser();
    }
    let mounted = true;
    fetchingPromise
      .then((result) => {
        cachedUser = result;
        fetchingPromise = null;
        if (mounted) {
          setUser(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        cachedUser = null;
        fetchingPromise = null;
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const role = user?.role || null;

  const can = useCallback(
    (permission: Permission) => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    [role]
  );

  const canAny = useCallback(
    (permissions: Permission[]) => {
      if (!role) return false;
      return permissions.some((p) => hasPermission(role, p));
    },
    [role]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    cachedUser = undefined;
    fetchingPromise = null;
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    window.location.href = "/login";
  }, []);

  const refreshSession = useCallback(async () => {
    cachedUser = undefined;
    fetchingPromise = null;
    const u = await fetchSessionUser();
    cachedUser = u;
    setUser(u);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role,
    can,
    canAny,
    isFaculty: role === ROLES.STAFF,
    isAdmin: role === ROLES.ADMIN,
    isScheduler: role === ROLES.SCHEDULER,
    logout,
    refreshSession,
  };
}

export function clearRoleAuthCache() {
  cachedUser = undefined;
  fetchingPromise = null;
}
