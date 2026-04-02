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

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const schedules = await db.facultySchedule.findMany({
					where: { facultyId: faculty.id, isActive: true },
					include: {
						course: true,
						room: true,
					},
				});

				const classOptions = schedules.map((s) => ({
					id: s.id,
					courseId: s.courseId,
					courseName: s.course.name,
					courseCode: s.course.code,
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					room: `${s.room.building} ${s.room.name}`,
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
