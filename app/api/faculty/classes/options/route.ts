import { NextRequest } from "next/server";
import { AssignmentStatus } from "@prisma/client";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { resolveCourseMap } from "@/lib/course-lookup";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

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
				const schedules = await db.facultySchedule.findMany({
					where: {
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
					orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
				});
				const sql = (await import("@/lib/db")).getSql();
				const assignmentRows = (await sql`
					SELECT
						a.id,
						a.course_id,
						a.day_of_week,
						a.start_time,
						a.end_time,
						a.room_label,
						a.faculty_schedule_id,
						c.name AS course_name,
						c.code AS course_code
					FROM "faculty_schema"."faculty_course_assignments" a
					LEFT JOIN "course_schema"."courses" c ON c.id = a.course_id
					WHERE a.faculty_id = ${faculty.id}
					  AND a.status = 'ACCEPTED'
					  AND a.day_of_week IS NOT NULL
					  AND a.start_time IS NOT NULL
					  AND a.end_time IS NOT NULL
				`) as Array<{
					id: string;
					course_id: number | null;
					day_of_week: string;
					start_time: string;
					end_time: string;
					room_label: string | null;
					faculty_schedule_id: string | null;
					course_name: string | null;
					course_code: string | null;
				}>;

				const courseMap = await resolveCourseMap(
					schedules
						.map((s) => s.sharedCourseId)
						.filter((id): id is string => Boolean(id))
				);

				const scheduleClassOptions = schedules.map((s) => ({
					id: s.id,
					courseId: s.sharedCourseId ?? "",
					courseName:
						(s.sharedCourseId && courseMap.get(s.sharedCourseId)?.name) ??
						"No course linked",
					courseCode:
						(s.sharedCourseId && courseMap.get(s.sharedCourseId)?.code) ?? "\u2014",
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					room: s.facilityRoomId ? "Room assigned" : "No room",
				}));
				const scheduleIdSet = new Set(scheduleClassOptions.map((c) => c.id));
				const assignmentClassOptions = assignmentRows
					.filter((a) => !a.faculty_schedule_id || !scheduleIdSet.has(a.faculty_schedule_id))
					.map((a) => ({
						// Always use assignment-prefixed ids for fallback rows so submit API
						// can reliably resolve the selected option back to assignment data.
						id: `assignment-${a.id}`,
						courseId: a.course_id ? String(a.course_id) : "",
						courseName: a.course_name ?? "No course linked",
						courseCode: a.course_code ?? "\u2014",
						dayOfWeek: a.day_of_week,
						startTime: a.start_time,
						endTime: a.end_time,
						room: a.room_label ?? "No room",
					}));
				const classOptions = [...scheduleClassOptions, ...assignmentClassOptions];

				return successResponse({ classes: classOptions });
			}
		} catch (e) {
			console.error("Class options error:", e);
			return internalErrorResponse("Failed to load class options");
		}
	}

	return successResponse({ classes: [] });
}
