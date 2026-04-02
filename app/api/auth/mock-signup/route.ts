import { NextRequest, NextResponse } from "next/server";
import { isMockAuthAllowed } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/types/roles";

export async function POST(request: NextRequest) {
	if (!isMockAuthAllowed()) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "FORBIDDEN", message: "Mock signup is disabled" } },
			{ status: 403 }
		);
	}

	const body = (await request.json().catch(() => ({}))) as {
		email?: string;
		password?: string;
		name?: string;
	};

	if (!body.email || !body.password || !body.name) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "BAD_REQUEST", message: "All fields required" } },
			{ status: 400 }
		);
	}

	const userData = {
		id: `user_${Date.now()}`,
		name: body.name,
		email: body.email,
		image: null,
		role: ROLES.STAFF,
	};

	const response = NextResponse.json({
		success: true,
		data: { user: userData, session: { token: "mock" } },
		error: null,
	});

	response.cookies.set("faculty_session", JSON.stringify(userData), {
		httpOnly: true,
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
		sameSite: "lax",
	});

	return response;
}
