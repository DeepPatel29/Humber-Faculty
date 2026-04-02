import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const count = await db.facultyNotification.count({
					where: { facultyId: faculty.id, isRead: false },
				});
				return successResponse({ count });
			}
		} catch (e) {
			console.error("Unread count DB error:", e);
			return internalErrorResponse("Failed to load unread count");
		}
	}

	return successResponse({ count: 0 });
}
