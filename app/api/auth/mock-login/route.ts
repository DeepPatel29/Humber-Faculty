import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
	clearBetterAuthSessionCookies,
	isMockAuthAllowed,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const TEST_USERS: Record<string, { name: string; role: AppRole; password: string; skipFaculty?: boolean }> = {
	"admin@university.edu": { name: "Admin User", role: AppRole.ADMIN, password: "password123" },
	"faculty@university.edu": { name: "Dr. John Smith", role: AppRole.STAFF, password: "password123" },
	"scheduler@university.edu": { name: "Scheduler User", role: AppRole.SCHEDULER, password: "password123" },
	"student@university.edu": { name: "Student User", role: AppRole.STUDENT, password: "password123", skipFaculty: true },
};

function mockLoginDisabledMessage(): string {
	const base = "Mock login is disabled.";
	if (process.env.NODE_ENV === "production") {
		return `${base} It is not available in production.`;
	}
	const raw = process.env.ALLOW_MOCK_AUTH;
	const state =
		raw === undefined || raw === ""
			? "ALLOW_MOCK_AUTH is missing or empty in the environment the server sees."
			: `ALLOW_MOCK_AUTH is set but not enabled (current value is not true/1/yes).`;
	return `${base} ${state} Add ALLOW_MOCK_AUTH=true to .env in the project root (same folder as package.json), save, stop the dev server (Ctrl+C), then run npm run dev again.`;
}

export async function POST(request: NextRequest) {
	if (!isMockAuthAllowed()) {
		return NextResponse.json(
			{
				success: false,
				data: null,
				error: { code: "FORBIDDEN", message: mockLoginDisabledMessage() },
			},
			{ status: 403 }
		);
	}

	const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
	const email = body.email?.trim() ?? "";

	if (!email || !body.password) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "BAD_REQUEST", message: "Email and password required" } },
			{ status: 400 }
		);
	}

	const testUser = TEST_USERS[email];

	if (!testUser || testUser.password !== body.password) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
			{ status: 401 }
		);
	}

	let userId = `user_${Date.now()}`;
	let facultyId: string | undefined;

	if (db) {
		try {
			let user = await db.user.findUnique({
				where: { email },
				include: { faculty: true },
			});

			if (!user) {
				const dept =
					(await db.department.findFirst()) ||
					(await db.department.create({
						data: { name: "Computer Science", code: "CS" },
					}));

				if (testUser.skipFaculty) {
					user = await db.user.create({
						data: {
							email,
							name: testUser.name,
							role: testUser.role,
							emailVerified: true,
							accounts: {
								create: {
									accountId: `acc_${Date.now()}`,
									providerId: "credential",
									password: testUser.password,
								},
							},
						},
						include: { faculty: true },
					});
				} else {
					user = await db.user.create({
						data: {
							email,
							name: testUser.name,
							role: testUser.role,
							emailVerified: true,
							accounts: {
								create: {
									accountId: `acc_${Date.now()}`,
									providerId: "credential",
									password: testUser.password,
								},
							},
							faculty: {
								create: {
									departmentId: dept.id,
									employeeId: `EMP-${Date.now()}`,
									designation: testUser.role === AppRole.ADMIN ? "Admin" : "Faculty",
								},
							},
						},
						include: { faculty: true },
					});
				}
			}

			userId = user.id;
			facultyId = user.faculty?.id;
		} catch (e) {
			console.error("Mock login DB error:", e);
		}
	}

	const userData = {
		id: userId,
		name: testUser.name,
		email,
		role: testUser.role,
		facultyId,
	};

	const response = NextResponse.json({
		success: true,
		data: { user: userData, session: { token: "mock", userId } },
		error: null,
	});

	response.cookies.set("faculty_session", JSON.stringify(userData), {
		httpOnly: true,
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
		sameSite: "lax",
	});

	clearBetterAuthSessionCookies(response);

	return response;
}
