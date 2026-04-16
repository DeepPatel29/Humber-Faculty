import { NextRequest } from "next/server";
import {
  getSessionUser,
  requireAuth,
  requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { activeFacultyScheduleWhere } from "@/lib/faculty-schedule-queries";
import { resolveCourseMap } from "@/lib/course-lookup";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await getSessionUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  try {
    const { id } = await params;
    const colleague = await db.faculty.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!colleague) {
      return notFoundResponse("Colleague");
    }

    // Prevent fetching own classes from colleague endpoint.
    if (colleague.userId === user!.id) {
      return forbiddenResponse("Cannot request colleague classes for self");
    }

    const schedules = await db.facultySchedule.findMany({
      where: activeFacultyScheduleWhere(colleague.id),
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const courseMap = await resolveCourseMap(
      schedules
        .map((s) => s.sharedCourseId)
        .filter((courseId): courseId is string => Boolean(courseId)),
    );

    const classes = schedules.map((s) => ({
      id: s.id,
      courseId: s.sharedCourseId ?? "",
      courseName:
        (s.sharedCourseId && courseMap.get(s.sharedCourseId)?.name) ||
        "No course linked",
      courseCode:
        (s.sharedCourseId && courseMap.get(s.sharedCourseId)?.code) || "-",
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.facilityRoomId ? "Room assigned" : "No room",
    }));

    return successResponse({ classes });
  } catch (error) {
    console.error("Colleague classes options error:", error);
    return internalErrorResponse("Failed to load colleague classes");
  }
}
