import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
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
					where: { facultyId: faculty.id, isActive: true },
					include: { course: true, room: true },
					orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
					take: limit,
				});

				return successResponse(
					schedules.map((s) => ({
						id: s.id,
						courseCode: s.course.code,
						courseName: s.course.name,
						dayOfWeek: s.dayOfWeek,
						startTime: s.startTime,
						endTime: s.endTime,
						roomName: s.room.name,
						building: s.room.building,
						type: s.type,
						section: s.section,
						program: s.program,
						semester: s.semester,
					}))
				);
			}
		} catch (e) {
			console.error("Upcoming timetable error:", e);
			return internalErrorResponse("Failed to load upcoming classes");
		}
	}

	return successResponse([]);
}
