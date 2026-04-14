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

				const courseMap = await resolveCourseMap(schedules.map((s) => s.courseId));

				return successResponse(
					schedules.map((s) => ({
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
					}))
				);
			}
		} catch (e) {
			console.error("Timetable DB error:", e);
			return internalErrorResponse("Failed to load timetable");
		}
	}

	return successResponse([]);
}
