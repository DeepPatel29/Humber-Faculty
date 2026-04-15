import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { db, getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const roleError = requireRole(user, ROLES.ADMIN);
	if (roleError) return roleError;

	if (!db) {
		return successResponse({ faculty: [], total: 0 });
	}

	try {
		const sqlClient = getSql();
		const courseDepartments = (await sqlClient`
			SELECT id::text AS id, name
			FROM "course_schema"."departments"
		`) as Array<{ id: string; name: string }>;
		let facultyDepartments: Array<{ id: string; name: string }> = [];
		try {
			facultyDepartments = (await sqlClient`
				SELECT id::text AS id, name
				FROM "faculty_schema"."Department"
			`) as Array<{ id: string; name: string }>;
		} catch {
			// Table name may vary across environments; keep best-effort lookup.
		}
		const departmentById = new Map<string, string>(
			[...courseDepartments, ...facultyDepartments].map((d) => [d.id, d.name])
		);

		const faculty = await db.faculty.findMany({
			include: {
				user: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return successResponse({
			faculty: faculty.map((f) => ({
				department: f.sharedDepartmentId
					? departmentById.get(f.sharedDepartmentId) || f.sharedDepartmentId
					: "Unknown",
				id: f.id,
				userId: f.userId,
				sharedDepartmentId: f.sharedDepartmentId,
				employeeId: f.employeeId,
				name: f.user.name,
				email: f.user.email,
				designation: f.designation,
				role: f.user.role,
				joiningDate: f.joiningDate.toISOString(),
			})),
			total: faculty.length,
		});
	} catch (error) {
		console.error("Admin faculty fetch error:", error);
		return internalErrorResponse("Failed to fetch faculty");
	}
}
