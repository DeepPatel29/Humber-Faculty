import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
	internalErrorResponse,
	notFoundResponse,
	successResponse,
} from "@/lib/api-response";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	const { id } = await params;

	if (!db) {
		return internalErrorResponse("Database not configured");
	}

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
		if (!faculty) {
			return notFoundResponse("Faculty");
		}

		const result = await db.facultyNotification.updateMany({
			where: { id, facultyId: faculty.id },
			data: { isRead: true },
		});

		if (result.count === 0) {
			return notFoundResponse("Notification");
		}

		return successResponse({ message: "Marked as read" });
	} catch (e) {
		console.error("Mark read error:", e);
		return internalErrorResponse("Failed to mark notification read");
	}
}
