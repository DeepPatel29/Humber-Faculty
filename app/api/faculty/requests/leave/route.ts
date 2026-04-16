import { NotificationType } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireFacultyPortalAccess,
	requirePermission,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
	createdResponse,
	internalErrorResponse,
	notFoundResponse,
	parseRequestBody,
	serviceUnavailableResponse,
} from "@/lib/api-response";
import { createLeaveRequestSchema } from "@/lib/validations/faculty";

export async function POST(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const permError = requirePermission(user, "requests:create");
	if (permError) return permError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (!db) {
		return serviceUnavailableResponse("Database not available");
	}

	const parsed = await parseRequestBody(request, createLeaveRequestSchema);
	if (!parsed.success) return parsed.response;

	const body = parsed.data;

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);

		if (!faculty) {
			return notFoundResponse("Faculty record");
		}

		const effective = new Date(body.effectiveDate);
		const end = new Date(body.endDate);

		const newRequest = await db.facultyRequest.create({
			data: {
				facultyId: faculty.id,
				type: "LEAVE",
				status: "PENDING",
				title: `Leave Request — ${effective.toLocaleDateString()} to ${end.toLocaleDateString()}`,
				description: body.reason,
				requestDate: new Date(),
				effectiveDate: effective,
				endDate: end,
				targetFacultyId: null,
				targetScheduleId: null,
				newDate: null,
				newStartTime: null,
				newEndTime: null,
				reason: body.reason,
				timeline: {
					create: {
						status: "PENDING",
						comment: "Leave request submitted",
						createdBy: user!.name,
					},
				},
			},
			include: {
				timeline: true,
			},
		});

		await db.facultyNotification.create({
			data: {
				facultyId: faculty.id,
				type: NotificationType.REQUEST_UPDATE,
				title: "Leave Request Submitted",
				message: `Your leave request from ${effective.toLocaleDateString()} to ${end.toLocaleDateString()} is pending.`,
				isRead: false,
				link: "/faculty/requests",
			},
		});

		return createdResponse(newRequest);
	} catch (error) {
		console.error("Leave request error:", error);
		return internalErrorResponse("Failed to create leave request");
	}
}
