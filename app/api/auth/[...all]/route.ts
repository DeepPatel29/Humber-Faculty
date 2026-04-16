import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  hasBetterAuthSessionCookie,
  isMockAuthAllowed,
} from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  // If Better Auth has a session cookie, resolve get-session from Better Auth first.
  // Otherwise a stale faculty_session (e.g. after logging in as admin then as faculty via email/password)
  // would incorrectly report ADMIN for everyone.
  if (auth && hasBetterAuthSessionCookie(request)) {
    try {
      return await auth.handler(request);
    } catch {
      /* fall through */
    }
  }

  if (isMockAuthAllowed()) {
    const sessionCookie = request.cookies.get("faculty_session")?.value;
    if (sessionCookie) {
      try {
        const userData = JSON.parse(sessionCookie) as {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          facultyId?: string;
        };
        return NextResponse.json({
          session: {
            userId: userData.id,
            token: "mock-token",
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
          user: {
            id: userData.id,
            name: userData.name ?? "User",
            email: userData.email ?? "",
            image: null,
            role: userData.role || "STAFF",
            facultyId: userData.facultyId,
          },
        });
      } catch {
        return NextResponse.json({ session: null, user: null });
      }
    }
  }

  if (auth) {
    try {
      return await auth.handler(request);
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({ session: null, user: null });
}

function generateUserIdFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  }
  return `user_${Math.abs(hash).toString(36)}`;
}

export async function POST(request: NextRequest) {
  if (auth) {
    try {
      return await auth.handler(request);
    } catch {
      /* fall through */
    }
  }

  if (!isMockAuthAllowed()) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "UNAVAILABLE", message: "Auth service unavailable" } },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (url.pathname.includes("sign-up")) {
    const role = typeof body.role === "string" ? body.role : "STAFF";
    const email = typeof body.email === "string" ? body.email : `user_${Date.now()}`;
    const userId = generateUserIdFromEmail(email);
    const userData = {
      id: userId,
      name: typeof body.name === "string" ? body.name : "Faculty User",
      email,
      image: null,
      role,
    };
    const response = NextResponse.json({
      user: userData,
      session: { token: "mock-session", userId: userData.id },
    });
    response.cookies.set("faculty_session", JSON.stringify(userData), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  }

  if (url.pathname.includes("sign-in")) {
    let role = "STAFF";
    const emailStr = typeof body.email === "string" ? body.email : "";
    const lowerEmail = emailStr.toLowerCase();
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const lowerName = rawName.toLowerCase();
    if (lowerEmail.includes("admin")) role = "ADMIN";
    else if (lowerEmail.includes("scheduler")) role = "SCHEDULER";
    else if (lowerEmail.includes("student")) role = "STUDENT";

    const userId = generateUserIdFromEmail(emailStr || `user_${Date.now()}`);

    let displayName = "Faculty Member";
    if (role === "ADMIN") {
      displayName = "Admin User";
    } else if (role === "SCHEDULER") {
      displayName = "Scheduler User";
    } else if (role === "STUDENT") {
      displayName = "Student User";
    } else if (lowerEmail.includes("john.smith") || lowerName.includes("john smith")) {
      displayName = "Dr. John Smith";
    } else if (rawName) {
      displayName = rawName;
    }

    const userData = {
      id: userId,
      name: displayName,
      email: emailStr || "user@university.edu",
      image: null,
      role,
    };
    const response = NextResponse.json({
      user: userData,
      session: { token: "mock-session", userId: userData.id },
    });
    response.cookies.set("faculty_session", JSON.stringify(userData), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  }

  if (url.pathname.includes("sign-out")) {
    const response = NextResponse.json({ success: true, data: { ok: true }, error: null });
    response.cookies.delete("faculty_session");
    return response;
  }

  return NextResponse.json(
    { success: false, data: null, error: { code: "NOT_FOUND", message: "Not found" } },
    { status: 404 }
  );
}
