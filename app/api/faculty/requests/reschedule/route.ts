import { AssignmentStatus, DayOfWeek, NotificationType, ScheduleItemType } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireFacultyPortalAccess,
	requirePermission,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists, getSql } from "@/lib/db";
import {
	badRequestResponse,
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
		const faculty =
			(user!.facultyId
				? await db.faculty.findUnique({
						where: { id: user!.facultyId },
						select: { id: true },
					})
				: null) ??
			(await ensureFacultyExists(user!.id, user!.name, user!.email));

		if (!faculty) {
			return notFoundResponse("Faculty record");
		}

		let resolvedScheduleId: string | null = null;
		const schedule = await db.facultySchedule.findFirst({
			where: {
				id: body.scheduleId,
				facultyId: faculty.id,
				isActive: true,
				assignmentStatus: {
					in: [
						AssignmentStatus.PENDING,
						AssignmentStatus.PLANNED,
						AssignmentStatus.ACTIVE,
					],
				},
			},
			select: { id: true },
		});
		if (schedule) {
			resolvedScheduleId = schedule.id;
		} else if (body.scheduleId.startsWith("assignment-")) {
			const assignmentId = body.scheduleId.replace("assignment-", "");
			const sql = getSql();
			const assignmentRows = (await sql`
				SELECT
					id,
					faculty_id,
					day_of_week,
					start_time,
					end_time,
					room_id,
					section,
					program,
					semester,
					academic_year,
					term_label,
					class_type,
					faculty_schedule_id
				FROM "faculty_schema"."faculty_course_assignments"
				WHERE id = ${assignmentId}
				  AND faculty_id = ${faculty.id}
				  AND status = 'ACCEPTED'
				LIMIT 1
			`) as Array<{
				id: string;
				faculty_id: string;
				day_of_week: string | null;
				start_time: string | null;
				end_time: string | null;
				room_id: string | null;
				section: string | null;
				program: string | null;
				semester: number | null;
				academic_year: string | null;
				term_label: string | null;
				class_type: string | null;
				faculty_schedule_id: string | null;
			}>;
			const assignment = assignmentRows[0];
			if (!assignment?.day_of_week || !assignment.start_time || !assignment.end_time) {
				return badRequestResponse("Selected class is missing timetable details");
			}

			if (assignment.faculty_schedule_id) {
				resolvedScheduleId = assignment.faculty_schedule_id;
			} else {
				const day = assignment.day_of_week.toUpperCase() as DayOfWeek;
				const classTypeRaw = assignment.class_type?.toUpperCase() ?? "LECTURE";
				const classType = Object.values(ScheduleItemType).includes(
					classTypeRaw as ScheduleItemType
				)
					? (classTypeRaw as ScheduleItemType)
					: ScheduleItemType.LECTURE;
				const created = await db.facultySchedule.create({
					data: {
						facultyId: faculty.id,
						sharedCourseId: null,
						facilityRoomId: assignment.room_id,
						dayOfWeek: day,
						startTime: assignment.start_time,
						endTime: assignment.end_time,
						type: classType,
						section: assignment.section,
						program: assignment.program,
						semester: assignment.semester,
						academicYear: assignment.academic_year ?? "2024-2025",
						schedulerTermId: assignment.term_label,
						isActive: true,
						assignmentStatus: "ACTIVE",
					},
					select: { id: true },
				});
				resolvedScheduleId = created.id;
				await sql`
					UPDATE "faculty_schema"."faculty_course_assignments"
					SET faculty_schedule_id = ${created.id}
					WHERE id = ${assignmentId}
				`;
			}
		}

		if (!resolvedScheduleId) {
			return badRequestResponse("Selected class is not available for your account");
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
				schedulerEventId: resolvedScheduleId,
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
