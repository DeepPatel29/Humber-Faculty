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
				const schedules = await db.facultySchedule.findMany({
					where: activeFacultyScheduleWhere(faculty.id),
					orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
				});

				const courseMap = await resolveCourseMap(
					schedules
						.map((s) => s.sharedCourseId)
						.filter((id): id is string => Boolean(id))
				);

				const classOptions = schedules.map((s) => ({
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

				return successResponse({ classes: classOptions });
			}
		} catch (e) {
			console.error("Class options error:", e);
			return internalErrorResponse("Failed to load class options");
		}
	}

	return successResponse({ classes: [] });
}
