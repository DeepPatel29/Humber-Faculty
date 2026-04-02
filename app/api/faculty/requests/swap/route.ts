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
import { createSwapRequestSchema } from "@/lib/validations/faculty";

export async function POST(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const permError = requirePermission(user, "requests:create");
	if (permError) return permError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (!db) {
		return serviceUnavailableResponse("Database not available");
	}

	const parsed = await parseRequestBody(request, createSwapRequestSchema);
	if (!parsed.success) return parsed.response;

	const body = parsed.data;

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);

		if (!faculty) {
			return notFoundResponse("Faculty record");
		}

		const desc = `${body.reason} (myScheduleId: ${body.myScheduleId})`;

		const newRequest = await db.facultyRequest.create({
			data: {
				facultyId: faculty.id,
				type: "SWAP",
				status: "PENDING",
				title: `Swap Request — ${new Date().toLocaleDateString()}`,
				description: desc,
				requestDate: new Date(),
				effectiveDate: new Date(body.effectiveDate),
				endDate: null,
				targetFacultyId: body.targetFacultyId,
				targetScheduleId: body.targetScheduleId,
				newDate: null,
				newStartTime: null,
				newEndTime: null,
				reason: body.reason,
				timeline: {
					create: {
						status: "PENDING",
						comment: "Swap request submitted",
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
				title: "Swap Request Submitted",
				message: "Your swap request has been submitted and is pending approval.",
				isRead: false,
				link: "/faculty/requests",
			},
		});

		return createdResponse(newRequest);
	} catch (error) {
		console.error("Swap request error:", error);
		return internalErrorResponse("Failed to create swap request");
	}
}
