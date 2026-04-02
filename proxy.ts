import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const facultySession = request.cookies.get("faculty_session")?.value;
  const betterAuthSession =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const sessionToken = facultySession || betterAuthSession;

  const isProtectedPage =
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scheduler");
  const isProtectedApi =
    pathname.startsWith("/api/faculty") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/scheduler");

  if ((isProtectedPage || isProtectedApi) && !sessionToken) {
    if (isProtectedApi) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionToken && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/faculty/dashboard", request.url));
  }

  let role = "STAFF";

  if (facultySession) {
    try {
      const data = JSON.parse(facultySession) as { role?: string };
      role = data.role || "STAFF";
    } catch {
      /* ignore */
    }
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/scheduler") && role !== "SCHEDULER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
