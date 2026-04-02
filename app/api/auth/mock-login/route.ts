import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isMockAuthAllowed } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const TEST_USERS: Record<string, { name: string; role: AppRole; password: string; skipFaculty?: boolean }> = {
	"admin@university.edu": { name: "Admin User", role: AppRole.ADMIN, password: "password123" },
	"faculty@university.edu": { name: "Dr. John Smith", role: AppRole.STAFF, password: "password123" },
	"scheduler@university.edu": { name: "Scheduler User", role: AppRole.SCHEDULER, password: "password123" },
	"student@university.edu": { name: "Student User", role: AppRole.STUDENT, password: "password123", skipFaculty: true },
};

export async function POST(request: NextRequest) {
	if (!isMockAuthAllowed()) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "FORBIDDEN", message: "Mock login is disabled" } },
			{ status: 403 }
		);
	}

	const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };

	if (!body.email || !body.password) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "BAD_REQUEST", message: "Email and password required" } },
			{ status: 400 }
		);
	}

	const testUser = TEST_USERS[body.email];

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
				where: { email: body.email },
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
							email: body.email,
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
							email: body.email,
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
		email: body.email,
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

	return response;
}
