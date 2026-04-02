"use client";

import { type Permission } from "@/lib/types/roles";
import { useRoleAuth } from "@/hooks/use-role-auth";

interface RoleGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  roles?: string[];
}

export function RoleGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  roles,
}: RoleGateProps) {
  const { user, can, canAny, role } = useRoleAuth();

  if (!user || !role) return <>{fallback}</>;

  if (roles) {
    if (!roles.includes(role)) return <>{fallback}</>;
    return <>{children}</>;
  }

  if (permission) {
    if (!can(permission)) return <>{fallback}</>;
    return <>{children}</>;
  }

  if (permissions) {
    if (requireAll) {
      const hasAll = permissions.every((p) => can(p));
      if (!hasAll) return <>{fallback}</>;
    } else {
      if (!canAny(permissions)) return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate roles={["ADMIN"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function FacultyOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate roles={["STAFF"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function SchedulerOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate roles={["SCHEDULER"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function ReadOnlyBanner() {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 mb-6">
      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
        🔒 You have read-only access to this page
      </p>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-800 dark:text-red-300">
          Access Denied
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to access this page. Contact your
          administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}
