import { NotificationType, RequestStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";
import {
	internalErrorResponse,
	notFoundResponse,
	parseRequestBody,
	serviceUnavailableResponse,
	successResponse,
} from "@/lib/api-response";
import { adminPatchFacultyRequestSchema } from "@/lib/validations/faculty";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { user } = await getSessionUser(request);
	const roleError = requireRole(user, ROLES.ADMIN);
	if (roleError) return roleError;

	if (!db) {
		return serviceUnavailableResponse("Database not available");
	}

	const parsed = await parseRequestBody(request, adminPatchFacultyRequestSchema);
	if (!parsed.success) return parsed.response;

	const { status, comment } = parsed.data;
	const prismaStatus =
		status === "APPROVED" ? RequestStatus.APPROVED : RequestStatus.REJECTED;

	try {
		const { id } = await params;

		const existingRequest = await db.facultyRequest.findUnique({
			where: { id },
			include: { faculty: { include: { user: true } } },
		});

		if (!existingRequest) {
			return notFoundResponse("Request");
		}

		const updatedRequest = await db.facultyRequest.update({
			where: { id },
			data: {
				status: prismaStatus,
				timeline: {
					create: {
						status: prismaStatus,
						comment:
							comment ||
							(status === "APPROVED" ? "Approved by admin" : "Rejected by admin"),
						createdBy: user!.name,
					},
				},
			},
			include: {
				timeline: { orderBy: { createdAt: "asc" } },
			},
		});

		await db.facultyNotification.create({
			data: {
				facultyId: existingRequest.facultyId,
				type: NotificationType.REQUEST_UPDATE,
				title: `Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
				message: `Your ${existingRequest.type.toLowerCase()} request has been ${status.toLowerCase()}.`,
				isRead: false,
				link: "/faculty/requests",
			},
		});

		return successResponse(updatedRequest);
	} catch (error) {
		console.error("Request approval error:", error);
		return internalErrorResponse("Failed to update request");
	}
}
