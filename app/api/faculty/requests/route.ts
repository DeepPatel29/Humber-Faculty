import { RequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { internalErrorResponse, parseQueryParams, successResponse } from "@/lib/api-response";
import { requestsQuerySchema } from "@/lib/validations/faculty";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	const q = parseQueryParams(new URL(request.url).searchParams, requestsQuerySchema);
	if (!q.success) return q.response;

	const { status, type } = q.data;

	if (db) {
		try {
			const faculty =
				(user!.facultyId
					? await db.faculty.findUnique({
							where: { id: user!.facultyId },
							select: { id: true },
						})
					: null) ??
				(await ensureFacultyExists(user!.id, user!.name, user!.email));
			if (faculty) {
				const requests = await db.facultyRequest.findMany({
					where: {
						facultyId: faculty.id,
						...(status !== undefined ? { status: status as RequestStatus } : {}),
						...(type !== undefined ? { type } : {}),
					},
					include: { timeline: { orderBy: { createdAt: "asc" } } },
					orderBy: { createdAt: "desc" },
				});

				return successResponse({
					requests: requests.map((r) => ({
						id: r.id,
						facultyId: r.facultyId,
						type: r.type,
						status: r.status,
						title: r.title,
						description: r.description,
						requestDate: (r.requestDate || r.createdAt).toISOString(),
						effectiveDate: r.effectiveDate.toISOString(),
						endDate: r.endDate?.toISOString() || null,
						reason: r.reason,
						targetFacultyId: r.targetFacultyId,
						targetScheduleId: r.targetScheduleId,
						newDate: r.newDate?.toISOString() || null,
						newStartTime: r.newStartTime,
						newEndTime: r.newEndTime,
						timeline: r.timeline.map((t) => ({
							id: t.id,
							requestId: t.requestId,
							status: t.status,
							comment: t.comment,
							createdAt: t.createdAt.toISOString(),
							createdBy: t.createdBy,
						})),
					})),
					total: requests.length,
					userRole: user!.role,
				});
			}
		} catch (e) {
			console.error("Requests DB error:", e);
			return internalErrorResponse("Failed to load requests");
		}
	}

	return successResponse({ requests: [], total: 0, userRole: user!.role });
}
