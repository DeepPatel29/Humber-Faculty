import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db";
import {
  forbiddenResponse,
  unauthorizedResponse,
  type ApiErrorResponse,
} from "./api-response";
import {
  type UserRole,
  type Permission,
  hasPermission,
  ROLES,
} from "./types/roles";
/** Cookie names used by Better Auth for the session (see proxy.ts). */
const BETTER_AUTH_SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

export function hasBetterAuthSessionCookie(request: NextRequest): boolean {
  return BETTER_AUTH_SESSION_COOKIE_NAMES.some(
    (name) => Boolean(request.cookies.get(name)?.value)
  );
}

/** Clear Better Auth session cookies (e.g. when switching to mock login). */
export function clearBetterAuthSessionCookies(response: NextResponse): void {
  for (const name of BETTER_AUTH_SESSION_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
}

/** Mock cookie auth is opt-in only (local/dev). Production uses Better Auth only. */
export function isMockAuthAllowed(): boolean {
  const raw = process.env.ALLOW_MOCK_AUTH?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facultyId?: string;
}

interface SessionResult {
  user: SessionUser | null;
  error?: string;
}

function parseUserRole(value: string | undefined | null): UserRole {
  if (value === ROLES.ADMIN) return ROLES.ADMIN;
  if (value === ROLES.STAFF || value === "FACULTY") return ROLES.STAFF;
  if (value === ROLES.STUDENT) return ROLES.STUDENT;
  if (value === ROLES.SCHEDULER) return ROLES.SCHEDULER;
  return ROLES.STAFF;
}

export async function getSessionUser(request: NextRequest): Promise<SessionResult> {
  if (auth) {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session?.user) {
        const role = parseUserRole(session.user.role);
        let facultyId: string | undefined;
        if (db) {
          const row = await db.faculty.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          });
          facultyId = row?.id;
        }
        return {
          user: {
            id: session.user.id,
            name: session.user.name || "User",
            email: session.user.email || "",
            role,
            facultyId,
          },
        };
      }
    } catch {
      /* fall through */
    }
  }

  if (isMockAuthAllowed()) {
    const mockCookie = request.cookies.get("faculty_session")?.value;
    if (mockCookie) {
      try {
        const data: {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          facultyId?: string;
        } = JSON.parse(mockCookie) as typeof data;
        return {
          user: {
            id: data.id || "mock-id",
            name: data.name || "User",
            email: data.email || "",
            role: parseUserRole(data.role),
            facultyId: data.facultyId,
          },
        };
      } catch {
        /* ignore */
      }
    }
  }

  return { user: null, error: "Not authenticated" };
}

export function requireAuth(user: SessionResult["user"]): NextResponse<ApiErrorResponse> | null {
  if (!user) {
    return unauthorizedResponse();
  }
  return null;
}

/**
 * Blocks STUDENT from faculty-portal sub-APIs (dashboard, profile, requests, etc.).
 * STUDENT may only use canonical GET /api/faculty and GET /api/faculty/[id] (directory).
 */
export function requireFacultyPortalAccess(
  user: SessionResult["user"]
): NextResponse<ApiErrorResponse> | null {
  const authErr = requireAuth(user);
  if (authErr) return authErr;
  if (user!.role === ROLES.STUDENT) {
    return forbiddenResponse(
      "Students have read-only access to the faculty directory endpoints only"
    );
  }
  return null;
}

export function requirePermission(
  user: SessionResult["user"],
  permission: Permission
): NextResponse<ApiErrorResponse> | null {
  if (!user) {
    return unauthorizedResponse();
  }
  if (!hasPermission(user.role, permission)) {
    return forbiddenResponse("You do not have permission for this action");
  }
  return null;
}

export function requireRole(
  user: SessionResult["user"],
  ...roles: UserRole[]
): NextResponse<ApiErrorResponse> | null {
  if (!user) {
    return unauthorizedResponse();
  }
  if (!roles.includes(user.role)) {
    return forbiddenResponse(`Required role: ${roles.join(" or ")}`);
  }
  return null;
}
