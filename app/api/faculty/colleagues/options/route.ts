import { AppRole } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
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
				const colleagues = await db.faculty.findMany({
					where: {
						NOT: { id: faculty.id },
						user: { role: { in: [AppRole.STAFF, AppRole.ADMIN] } },
					},
					include: {
						user: true,
						department: true,
					},
				});

				const colleagueOptions = colleagues.map((c) => ({
					id: c.id,
					name: c.user.name,
					email: c.user.email,
					designation: c.designation,
					department: c.department?.name || "Unknown",
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
