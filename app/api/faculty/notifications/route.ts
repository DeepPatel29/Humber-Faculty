import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { internalErrorResponse, parseQueryParams, successResponse } from "@/lib/api-response";
import { notificationsQuerySchema } from "@/lib/validations/faculty";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	const q = parseQueryParams(new URL(request.url).searchParams, notificationsQuerySchema);
	if (!q.success) return q.response;

	const { unreadOnly, page, limit } = q.data;
	const skip = (page - 1) * limit;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const [notifications, total, unreadCount] = await Promise.all([
					db.facultyNotification.findMany({
						where: {
							facultyId: faculty.id,
							...(unreadOnly ? { isRead: false } : {}),
						},
						orderBy: { createdAt: "desc" },
						skip,
						take: limit,
					}),
					db.facultyNotification.count({
						where: {
							facultyId: faculty.id,
							...(unreadOnly ? { isRead: false } : {}),
						},
					}),
					db.facultyNotification.count({
						where: { facultyId: faculty.id, isRead: false },
					}),
				]);

				return successResponse({
					notifications: notifications.map((n) => ({
						id: n.id,
						type: n.type,
						title: n.title,
						message: n.message,
						isRead: n.isRead,
						link: n.link,
						createdAt: n.createdAt.toISOString(),
					})),
					total,
					unreadCount,
				});
			}
		} catch (e) {
			console.error("Notifications DB error:", e);
			return internalErrorResponse("Failed to load notifications");
		}
	}

	return successResponse({ notifications: [], total: 0, unreadCount: 0 });
}
