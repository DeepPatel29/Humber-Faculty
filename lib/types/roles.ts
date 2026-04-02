/**
 * Rubric roles:
 * - ADMIN: full access
 * - STAFF: limited CRUD (faculty portal — profile, availability, requests, etc.)
 * - STUDENT: read-only (canonical GET /api/faculty, GET /api/faculty/[id] only)
 * SCHEDULER: legacy portal role; same mutation rules as STUDENT on faculty APIs; scheduler UI via /scheduler.
 */
export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  STUDENT: "STUDENT",
  SCHEDULER: "SCHEDULER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  "profile:read:own": ["STAFF", "ADMIN", "SCHEDULER"],
  "profile:read:any": ["ADMIN", "SCHEDULER"],
  "profile:edit:own": ["STAFF", "ADMIN"],
  "profile:edit:any": ["ADMIN"],

  "availability:read:own": ["STAFF", "ADMIN", "SCHEDULER"],
  "availability:read:any": ["ADMIN", "SCHEDULER"],
  "availability:edit:own": ["STAFF", "ADMIN"],
  "availability:edit:any": ["ADMIN"],

  "timetable:read:own": ["STAFF", "ADMIN", "SCHEDULER"],
  "timetable:read:any": ["ADMIN", "SCHEDULER"],
  "timetable:edit:own": ["STAFF", "ADMIN"],
  "timetable:edit:any": ["ADMIN"],

  "requests:read:own": ["STAFF", "ADMIN", "SCHEDULER"],
  "requests:read:any": ["ADMIN"],
  "requests:create": ["STAFF"],
  "requests:withdraw:own": ["STAFF"],
  "requests:approve": ["ADMIN"],
  "requests:reject": ["ADMIN"],

  "notifications:read:own": ["STAFF", "ADMIN", "SCHEDULER"],

  /** Canonical faculty resource (rubric CRUD) */
  "faculty:read:list": ["ADMIN", "STAFF", "STUDENT", "SCHEDULER"],
  "faculty:read:one": ["ADMIN", "STAFF", "STUDENT", "SCHEDULER"],
  "faculty:create": ["ADMIN"],
  "faculty:update:any": ["ADMIN"],
  "faculty:update:own": ["STAFF", "ADMIN"],
  "faculty:delete": ["ADMIN"],

  "admin:access": ["ADMIN"],
  "admin:manage-faculty": ["ADMIN"],
  "admin:manage-departments": ["ADMIN"],
  "admin:manage-requests": ["ADMIN"],
  "admin:view-reports": ["ADMIN"],

  "scheduler:access": ["SCHEDULER", "ADMIN"],
  "scheduler:read-constraints": ["SCHEDULER", "ADMIN"],
  "scheduler:read-timetable": ["SCHEDULER", "ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return (allowed as readonly string[]).includes(role);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export const ROLE_INFO: Record<
  UserRole,
  { label: string; color: string; description: string }
> = {
  STAFF: {
    label: "Staff",
    color: "blue",
    description: "Faculty portal: manage own profile, availability, timetable, and submit requests",
  },
  ADMIN: {
    label: "Admin",
    color: "purple",
    description: "Full access: manage faculty, departments, and approve requests",
  },
  STUDENT: {
    label: "Student",
    color: "gray",
    description: "Read-only access to faculty directory API",
  },
  SCHEDULER: {
    label: "Scheduler",
    color: "green",
    description: "View faculty constraints and timetables; read-only on faculty mutations",
  },
};

export const ROLE_ROUTES: Record<UserRole, string> = {
  STAFF: "/faculty/dashboard",
  ADMIN: "/admin/dashboard",
  STUDENT: "/faculty/dashboard",
  SCHEDULER: "/scheduler/dashboard",
};
