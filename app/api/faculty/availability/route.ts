import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
	requirePermission,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
	internalErrorResponse,
	parseRequestBody,
	successResponse,
} from "@/lib/api-response";
import { updateAvailabilityBodySchema } from "@/lib/validations/faculty";

const ALL_COURSES = [
	{ id: "c1", name: "Machine Learning", code: "CS501" },
	{ id: "c2", name: "Deep Learning", code: "CS601" },
	{ id: "c3", name: "Data Structures", code: "CS201" },
	{ id: "c4", name: "Algorithms", code: "CS401" },
	{ id: "c5", name: "Database Systems", code: "CS301" },
	{ id: "c6", name: "Computer Networks", code: "CS402" },
	{ id: "c7", name: "Operating Systems", code: "CS403" },
	{ id: "c8", name: "Software Engineering", code: "CS404" },
	{ id: "c9", name: "Artificial Intelligence", code: "CS502" },
	{ id: "c10", name: "Computer Vision", code: "CS602" },
];

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				let availability = await db.facultyAvailability.findUnique({
					where: { facultyId: faculty.id },
					include: { days: true },
				});

				if (!availability) {
					availability = await db.facultyAvailability.create({
						data: {
							facultyId: faculty.id,
							preferredSlot: "ANY",
							days: {
								create: [
									{ dayOfWeek: "MONDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "TUESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "WEDNESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "THURSDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "FRIDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "SATURDAY", isAvailable: false, startTime: null, endTime: null },
									{ dayOfWeek: "SUNDAY", isAvailable: false, startTime: null, endTime: null },
								],
							},
						},
						include: { days: true },
					});
				}

				return successResponse({
					id: availability.id,
					facultyId: availability.facultyId,
					preferredSlot: availability.preferredSlot,
					customStartTime: availability.customStartTime || undefined,
					customEndTime: availability.customEndTime || undefined,
					unavailableStart: availability.unavailableStart || undefined,
					unavailableEnd: availability.unavailableEnd || undefined,
					notes: availability.notes || "",
					days: availability.days.map((d) => ({
						id: d.id,
						availabilityId: d.availabilityId,
						dayOfWeek: d.dayOfWeek,
						isAvailable: d.isAvailable,
						startTime: d.startTime ?? undefined,
						endTime: d.endTime ?? undefined,
					})),
					allCourses: ALL_COURSES,
					eligibleCourseIds: [],
				});
			}
		} catch (e) {
			console.error("GET availability DB error:", e);
			return internalErrorResponse("Failed to load availability");
		}
	}

	return successResponse({
		id: "",
		facultyId: user!.id,
		preferredSlot: "ANY",
		customStartTime: undefined,
		customEndTime: undefined,
		unavailableStart: undefined,
		unavailableEnd: undefined,
		notes: "",
		days: [
			{ dayOfWeek: "MONDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
			{ dayOfWeek: "TUESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
			{ dayOfWeek: "WEDNESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
			{ dayOfWeek: "THURSDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
			{ dayOfWeek: "FRIDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
			{ dayOfWeek: "SATURDAY", isAvailable: false },
			{ dayOfWeek: "SUNDAY", isAvailable: false },
		],
		allCourses: ALL_COURSES,
		eligibleCourseIds: [],
	});
}

export async function PUT(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requirePermission(user, "availability:edit:own");
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	const parsed = await parseRequestBody(request, updateAvailabilityBodySchema);
	if (!parsed.success) return parsed.response;

	const body = parsed.data;

	if (!db) {
		return internalErrorResponse("Database not configured");
	}

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
		if (!faculty) {
			return internalErrorResponse("Could not resolve faculty record");
		}

		const updated = await db.facultyAvailability.upsert({
			where: { facultyId: faculty.id },
			create: {
				facultyId: faculty.id,
				preferredSlot: body.preferredSlot ?? "ANY",
				customStartTime: body.customStartTime ?? null,
				customEndTime: body.customEndTime ?? null,
				unavailableStart: body.unavailableStart ?? null,
				unavailableEnd: body.unavailableEnd ?? null,
				notes: body.notes ?? null,
			},
			update: {
				...(body.preferredSlot !== undefined && { preferredSlot: body.preferredSlot }),
				...(body.customStartTime !== undefined && { customStartTime: body.customStartTime }),
				...(body.customEndTime !== undefined && { customEndTime: body.customEndTime }),
				...(body.unavailableStart !== undefined && { unavailableStart: body.unavailableStart }),
				...(body.unavailableEnd !== undefined && { unavailableEnd: body.unavailableEnd }),
				...(body.notes !== undefined && { notes: body.notes }),
			},
		});

		if (body.days && body.days.length > 0) {
			for (const day of body.days) {
				await db.facultyAvailabilityDay.upsert({
					where: {
						availabilityId_dayOfWeek: {
							availabilityId: updated.id,
							dayOfWeek: day.dayOfWeek,
						},
					},
					create: {
						availabilityId: updated.id,
						dayOfWeek: day.dayOfWeek,
						isAvailable: day.isAvailable,
						startTime: day.isAvailable ? (day.startTime ?? null) : null,
						endTime: day.isAvailable ? (day.endTime ?? null) : null,
					},
					update: {
						isAvailable: day.isAvailable,
						startTime: day.isAvailable ? (day.startTime ?? null) : null,
						endTime: day.isAvailable ? (day.endTime ?? null) : null,
					},
				});
			}
		}

		if (body.submitAsRequest) {
			await db.facultyRequest.create({
				data: {
					facultyId: faculty.id,
					type: "RESCHEDULE",
					status: "PENDING",
					title: "Availability Update Request",
					description: "Faculty submitted updated availability preferences",
					effectiveDate: new Date(),
					reason: body.notes || "Availability preferences updated",
				},
			});
		}

		const result = await db.facultyAvailability.findUnique({
			where: { facultyId: faculty.id },
			include: { days: true },
		});

		if (!result) {
			return internalErrorResponse("Failed to refresh availability");
		}

		return successResponse({
			id: result.id,
			facultyId: result.facultyId,
			preferredSlot: result.preferredSlot,
			customStartTime: result.customStartTime || undefined,
			customEndTime: result.customEndTime || undefined,
			unavailableStart: result.unavailableStart || undefined,
			unavailableEnd: result.unavailableEnd || undefined,
			notes: result.notes || "",
			days: result.days.map((d) => ({
				id: d.id,
				availabilityId: d.availabilityId,
				dayOfWeek: d.dayOfWeek,
				isAvailable: d.isAvailable,
				startTime: d.startTime ?? undefined,
				endTime: d.endTime ?? undefined,
			})),
			allCourses: ALL_COURSES,
			eligibleCourseIds: [],
			message: body.submitAsRequest
				? "Availability update request submitted for admin approval"
				: "Availability saved",
		});
	} catch (e) {
		console.error("PUT availability DB error:", e);
		return internalErrorResponse("Failed to save availability");
	}
}
