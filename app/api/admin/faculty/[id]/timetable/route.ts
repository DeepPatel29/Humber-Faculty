import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { resolveCourseMap } from "@/lib/course-lookup";
import { ROLES } from "@/lib/types/roles";
import { activeFacultyScheduleWhere } from "@/lib/faculty-schedule-queries";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  try {
    const { id } = await params;
    const schedules = await db.facultySchedule.findMany({
      where: activeFacultyScheduleWhere(id),
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const courseMap = await resolveCourseMap(
      schedules
        .map((s) => s.courseId)
        .filter((courseId): courseId is string => Boolean(courseId)),
    );

    return successResponse({
      items: schedules.map((s) => ({
        id: s.id,
        facultyId: s.facultyId,
        courseId: s.courseId ?? "",
        courseCode:
          (s.courseId && courseMap.get(s.courseId)?.code) || "",
        courseName:
          (s.courseId && courseMap.get(s.courseId)?.name) ||
          "No course linked",
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        section: s.section,
        program: s.program,
        semester: s.semester,
        academicYear: s.academicYear,
        assignmentStatus: s.assignmentStatus,
      })),
      total: schedules.length,
    });
  } catch (error) {
    console.error("Admin timetable fetch error:", error);
    return internalErrorResponse("Failed to fetch faculty timetable");
  }
}
