import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { activeFacultyScheduleWhere } from "@/lib/faculty-schedule-queries";
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
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const { searchParams } = new URL(request.url);
				const courseCode = searchParams.get("courseCode");

				const where = activeFacultyScheduleWhere(faculty.id);

				if (courseCode) {
					const matching = await db.sharedCourse.findMany({
						where: { code: courseCode },
						select: { id: true },
					});
					const matchingIds = matching.map((c) => String(c.id));
					if (matchingIds.length > 0) {
						(where as Record<string, unknown>).courseId = { in: matchingIds };
					}
				}

				const schedules = await db.facultySchedule.findMany({
					where,
					include: { room: true },
					orderBy: { startTime: "asc" },
				});
				const sql = (await import("@/lib/db")).getSql();
				const assignmentRows = (await sql`
					SELECT
						a.id,
						a.course_id,
						c.name AS course_name,
						c.code AS course_code,
						a.day_of_week,
						a.start_time,
						a.end_time,
						a.room_label,
						a.class_type
					FROM "faculty_schema"."faculty_course_assignments" a
					JOIN "course_schema"."courses" c ON c.id = a.course_id
					WHERE a.faculty_id = ${faculty.id}
					  AND a.status = 'ACCEPTED'
				`) as Array<{
					id: string;
					course_id: number;
					course_name: string;
					course_code: string;
					day_of_week: string | null;
					start_time: string | null;
					end_time: string | null;
					room_label: string | null;
					class_type: string | null;
				}>;

				const courseMap = await resolveCourseMap(schedules.map((s) => s.courseId));
				const baseItems = schedules.map((s) => ({
						id: s.id,
						facultyId: s.facultyId,
						courseId: s.courseId,
						roomId: s.roomId,
						termId: s.termId,
						courseName: (s.courseId && courseMap.get(s.courseId)?.name) || "Unknown",
						courseCode: (s.courseId && courseMap.get(s.courseId)?.code) || "",
						dayOfWeek: s.dayOfWeek,
						startTime: s.startTime,
						endTime: s.endTime,
						roomName: s.room?.name || "TBA",
						building: s.room?.building || "",
						type: s.type,
						section: s.section || "",
						program: s.program || "",
						semester: s.semester,
						academicYear: s.academicYear,
						isActive: s.isActive,
						assignmentStatus: s.assignmentStatus,
						studentCount: s.studentCount,
						startDate: s.startDate?.toISOString() ?? null,
						endDate: s.endDate?.toISOString() ?? null,
					}));
				const assignmentItems = assignmentRows
					.filter((a) => a.day_of_week && a.start_time && a.end_time)
					.map((a) => ({
						id: `assignment-${a.id}`,
						facultyId: faculty.id,
						courseId: String(a.course_id),
						roomId: null,
						termId: null,
						courseName: a.course_name,
						courseCode: a.course_code,
						dayOfWeek: a.day_of_week!,
						startTime: a.start_time!,
						endTime: a.end_time!,
						roomName: a.room_label || "TBA",
						building: "",
						type: a.class_type || "LECTURE",
						section: "",
						program: "",
						semester: null,
						academicYear: "",
						isActive: true,
						assignmentStatus: "ACTIVE",
						studentCount: null,
						startDate: null,
						endDate: null,
					}));

				return successResponse([...baseItems, ...assignmentItems]);
			}
		} catch (e) {
			console.error("Timetable DB error:", e);
			return internalErrorResponse("Failed to load timetable");
		}
	}

	return successResponse([]);
}
