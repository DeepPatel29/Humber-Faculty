import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function PUT(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				await db.facultyNotification.updateMany({
					where: { facultyId: faculty.id, isRead: false },
					data: { isRead: true },
				});
			}
		} catch (e) {
			console.error("Mark all read error:", e);
			return internalErrorResponse("Failed to mark all as read");
		}
	}

	return successResponse({ message: "All marked as read" });
}
