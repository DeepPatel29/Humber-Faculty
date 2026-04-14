import { DayOfWeek } from "@prisma/client";
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

const WEEK_DAYS: DayOfWeek[] = [
	DayOfWeek.SUNDAY,
	DayOfWeek.MONDAY,
	DayOfWeek.TUESDAY,
	DayOfWeek.WEDNESDAY,
	DayOfWeek.THURSDAY,
	DayOfWeek.FRIDAY,
	DayOfWeek.SATURDAY,
];

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const todayDay = WEEK_DAYS[new Date().getDay()];

				const todayClasses = await db.facultySchedule.findMany({
					where: activeFacultyScheduleWhere(faculty.id, { dayOfWeek: todayDay }),
					include: { room: true },
					orderBy: { startTime: "asc" },
				});

				const courseMap = await resolveCourseMap(todayClasses.map((s) => s.courseId));

				return successResponse(
					todayClasses.map((s) => ({
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
			console.error("Timetable today error:", e);
			return internalErrorResponse("Failed to load today's classes");
		}
	}

	return successResponse([]);
}
