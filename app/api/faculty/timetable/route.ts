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
					orderBy: { startTime: "asc" },
				});

				const courseIds = schedules
					.map((s) => s.courseId)
					.filter((id): id is string => Boolean(id));
				const courseMap = await resolveCourseMap(courseIds);

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
					roomName: "TBA",
					building: "",
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

				return successResponse(baseItems);
			}
		} catch (e) {
			console.error("Timetable DB error:", e);
			return internalErrorResponse("Failed to load timetable");
		}
	}

	return successResponse([]);
}
