import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isMockAuthAllowed } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  if (auth) {
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
        };
        return NextResponse.json({
          session: {
            userId: userData.id,
            token: "mock-token",
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
          user: {
            ...userData,
            role: userData.role || "STAFF",
          },
        });
      } catch {
        return NextResponse.json({ session: null, user: null });
      }
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
    if (emailStr.includes("admin")) role = "ADMIN";
    else if (emailStr.includes("scheduler")) role = "SCHEDULER";
    else if (emailStr.includes("student")) role = "STUDENT";

    const userId = generateUserIdFromEmail(emailStr || `user_${Date.now()}`);

    let displayName = "Faculty Member";
    if (role === "ADMIN") {
      displayName = "Admin User";
    } else if (role === "SCHEDULER") {
      displayName = "Scheduler User";
    } else if (role === "STUDENT") {
      displayName = "Student User";
    } else if (emailStr.includes("john.smith") || String(body.name).toLowerCase().includes("john smith")) {
      displayName = "Dr. John Smith";
    } else if (typeof body.name === "string" && body.name) {
      displayName = body.name;
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
