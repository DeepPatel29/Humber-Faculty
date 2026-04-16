import { AppRole } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists, getSql } from "@/lib/db";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
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

				const colleagues = await db.faculty.findMany({
					where: {
						NOT: { id: faculty.id },
						user: { role: { in: [AppRole.STAFF, AppRole.ADMIN] } },
					},
					include: {
						user: true,
					},
				});

				const colleagueOptions = colleagues.map((c) => ({
					id: c.id,
					name: c.user.name,
					email: c.user.email,
					designation: c.designation,
					department: c.sharedDepartmentId
						? departmentById.get(c.sharedDepartmentId) || c.sharedDepartmentId
						: "Unknown",
					avatarUrl: c.user.image,
				}));

				return successResponse({ colleagues: colleagueOptions });
			}
		} catch (e) {
			console.error("Colleagues options error:", e);
			return internalErrorResponse("Failed to load colleagues");
		}
	}

	return successResponse({ colleagues: [] });
}
