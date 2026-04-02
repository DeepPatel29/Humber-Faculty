import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isMockAuthAllowed } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const TEST_USERS: Array<{
	email: string;
	name: string;
	role: AppRole;
	password: string;
	skipFaculty?: boolean;
}> = [
	{ email: "admin@university.edu", name: "Admin User", role: AppRole.ADMIN, password: "password123" },
	{ email: "faculty@university.edu", name: "Dr. John Smith", role: AppRole.STAFF, password: "password123" },
	{ email: "scheduler@university.edu", name: "Scheduler User", role: AppRole.SCHEDULER, password: "password123" },
	{ email: "student@university.edu", name: "Student User", role: AppRole.STUDENT, password: "password123", skipFaculty: true },
];

export async function GET(_request: NextRequest) {
	if (!isMockAuthAllowed()) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "FORBIDDEN", message: "Test user setup is disabled" } },
			{ status: 403 }
		);
	}

	if (!db) {
		return NextResponse.json(
			{ success: false, data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Database not available" } },
			{ status: 503 }
		);
	}

	try {
		const dept =
			(await db.department.findFirst({ where: { code: "CS" } })) ||
			(await db.department.findFirst());

		if (!dept) {
			return NextResponse.json(
				{ success: false, data: null, error: { code: "BAD_REQUEST", message: "No department found" } },
				{ status: 400 }
			);
		}

		const results: Array<Record<string, unknown>> = [];

		for (const testUser of TEST_USERS) {
			let user = await db.user.findUnique({
				where: { email: testUser.email },
				include: { accounts: true },
			});

			if (!user) {
				user = await db.user.create({
					data: {
						email: testUser.email,
						name: testUser.name,
						role: testUser.role,
						emailVerified: true,
					},
					include: { accounts: true },
				});

				await db.account.create({
					data: {
						accountId: user.id,
						providerId: "credential",
						userId: user.id,
						password: testUser.password,
					},
				});

				if (!testUser.skipFaculty) {
					const faculty = await db.faculty.create({
						data: {
							userId: user.id,
							departmentId: dept.id,
							employeeId: `EMP-${user.id.slice(0, 8).toUpperCase()}`,
							designation:
								testUser.role === AppRole.ADMIN
									? "Department Head"
									: testUser.role === AppRole.SCHEDULER
										? "Schedule Coordinator"
										: "Associate Professor",
						},
					});

					await db.facultyProfile.create({
						data: {
							facultyId: faculty.id,
							bio: "",
							phone: "",
							officeLocation: "",
							officeHours: "",
							researchInterests: [],
							qualifications: [],
							publications: [],
							socialLinks: {},
						},
					});
				}

				results.push({ email: testUser.email, role: testUser.role, created: true });
			} else {
				if (!user.accounts?.length) {
					await db.account.create({
						data: {
							accountId: user.id,
							providerId: "credential",
							userId: user.id,
							password: testUser.password,
						},
					});
				}
				results.push({ email: testUser.email, role: testUser.role, created: false, exists: true });
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				message: "Test users ready",
				users: results,
				credentials: TEST_USERS.map((u) => ({ email: u.email, password: u.password, role: u.role })),
			},
			error: null,
		});
	} catch (error) {
		console.error("Setup error:", error);
		return NextResponse.json(
			{ success: false, data: null, error: { code: "INTERNAL_ERROR", message: String(error) } },
			{ status: 500 }
		);
	}
}
