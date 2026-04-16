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

	const limit = Math.min(
		parseInt(new URL(request.url).searchParams.get("limit") || "10", 10) || 10,
		50
	);

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const schedules = await db.facultySchedule.findMany({
					where: activeFacultyScheduleWhere(faculty.id),
					include: { room: true },
					orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
					take: limit,
				});

				const courseMap = await resolveCourseMap(schedules.map((s) => s.courseId));

				const rows = schedules.map((s) => ({
					id: s.id,
					courseCode: (s.courseId && courseMap.get(s.courseId)?.code) || "",
					courseName: (s.courseId && courseMap.get(s.courseId)?.name) || "Unknown",
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					roomName: s.room?.name || "TBA",
					building: s.room?.building || "",
					type: s.type,
					section: s.section,
					program: s.program,
					semester: s.semester,
				}));
				return successResponse(rows);
			}
		} catch (e) {
			console.error("Upcoming timetable error:", e);
			return internalErrorResponse("Failed to load upcoming classes");
		}
	}

	return successResponse([]);
}
