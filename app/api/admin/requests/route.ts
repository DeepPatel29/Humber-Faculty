import { RequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";
import {
	internalErrorResponse,
	successResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const roleError = requireRole(user, ROLES.ADMIN);
	if (roleError) return roleError;

	if (!db) {
		return successResponse({ requests: [], total: 0 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const statusParam = searchParams.get("status");

		const requests = await db.facultyRequest.findMany({
			where: statusParam
				? { status: statusParam as RequestStatus }
				: { status: RequestStatus.PENDING },
			include: {
				faculty: {
					include: {
						user: true,
						department: true,
					},
				},
				timeline: {
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return successResponse({
			requests: requests.map((r) => ({
				id: r.id,
				type: r.type,
				status: r.status,
				title: r.title,
				description: r.description,
				reason: r.reason,
				effectiveDate: r.effectiveDate.toISOString(),
				endDate: r.endDate?.toISOString() || null,
				requestDate: (r.requestDate || r.createdAt).toISOString(),
				createdAt: r.createdAt.toISOString(),
				faculty: {
					id: r.faculty.id,
					name: r.faculty.user.name,
					email: r.faculty.user.email,
					designation: r.faculty.designation,
					department: r.faculty.department?.name || "Unknown",
				},
				timeline: r.timeline.map((t) => ({
					id: t.id,
					status: t.status,
					comment: t.comment,
					createdBy: t.createdBy,
					createdAt: t.createdAt.toISOString(),
				})),
			})),
			total: requests.length,
		});
	} catch (error) {
		console.error("Admin requests fetch error:", error);
		return internalErrorResponse("Failed to fetch requests");
	}
}
