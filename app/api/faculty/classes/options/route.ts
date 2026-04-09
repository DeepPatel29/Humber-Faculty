import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { activeFacultyScheduleWhere } from "@/lib/faculty-schedule-queries";
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
					include: {
						course: true,
						room: true,
					},
					orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
				});

				// Include rows even when course or room is missing (common with partial scheduling data).
				// Otherwise the dropdown is empty and forms fail with "Invalid UUID" on empty scheduleId.
				const classOptions = schedules.map((s) => ({
					id: s.id,
					courseId: s.courseId ?? "",
					courseName: s.course?.name ?? "No course linked",
					courseCode: s.course?.code ?? "—",
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					room: s.room ? `${s.room.building} ${s.room.name}` : "No room",
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
