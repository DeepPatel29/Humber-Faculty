import { DayOfWeek } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
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
					where: { facultyId: faculty.id, dayOfWeek: todayDay, isActive: true },
					include: { course: true, room: true },
					orderBy: { startTime: "asc" },
				});

				return successResponse(
					todayClasses.map((s) => ({
						id: s.id,
						facultyId: s.facultyId,
						courseId: s.courseId,
						roomId: s.roomId,
						courseName: s.course?.name || "Unknown",
						courseCode: s.course?.code || "",
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
