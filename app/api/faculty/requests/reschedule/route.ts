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
import { createRescheduleRequestSchema } from "@/lib/validations/faculty";

export async function POST(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const permError = requirePermission(user, "requests:create");
	if (permError) return permError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (!db) {
		return serviceUnavailableResponse("Database not available");
	}

	const parsed = await parseRequestBody(request, createRescheduleRequestSchema);
	if (!parsed.success) return parsed.response;

	const body = parsed.data;

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);

		if (!faculty) {
			return notFoundResponse("Faculty record");
		}

		const newDate = new Date(body.newDate);

		const newRequest = await db.facultyRequest.create({
			data: {
				facultyId: faculty.id,
				type: "RESCHEDULE",
				status: "PENDING",
				title: `Reschedule Request — ${newDate.toLocaleDateString()}`,
				description: body.reason,
				requestDate: new Date(),
				effectiveDate: newDate,
				endDate: null,
				targetFacultyId: null,
				targetScheduleId: body.scheduleId,
				newDate,
				newStartTime: body.newStartTime,
				newEndTime: body.newEndTime,
				reason: body.reason,
				timeline: {
					create: {
						status: "PENDING",
						comment: "Reschedule request submitted",
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
				title: "Reschedule Request Submitted",
				message: `Your reschedule request for ${newDate.toLocaleDateString()} is pending approval.`,
				isRead: false,
				link: "/faculty/requests",
			},
		});

		return createdResponse(newRequest);
	} catch (error) {
		console.error("Reschedule request error:", error);
		return internalErrorResponse("Failed to create reschedule request");
	}
}
