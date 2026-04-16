import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { ensureCourseAssignmentTable } from "@/lib/course-assignment-store";
import { db, getSql } from "@/lib/db";
import { resolveCourseMap } from "@/lib/course-lookup";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { ROLES } from "@/lib/types/roles";

interface AcceptedAssignmentRow {
  id: string;
  faculty_id: string;
  course_id: number;
  course_code: string;
  course_name: string;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  room_label: string | null;
}

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.SCHEDULER, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return successResponse({ faculty: [] });
  }

  try {
    const facultyRows = await db.faculty.findMany({
      include: {
        user: true,
        schedules: {
          where: { isActive: true },
          include: { room: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const allCourseIds = facultyRows.flatMap((f) =>
      f.schedules.map((schedule) => schedule.courseId).filter(Boolean) as string[]
    );
    const courseMap = await resolveCourseMap(allCourseIds);

    await ensureCourseAssignmentTable();
    const sql = getSql();
    const acceptedAssignments = (await sql`
      SELECT
        a.id,
        a.faculty_id,
        a.course_id,
        c.code AS course_code,
        c.name AS course_name,
        a.day_of_week,
        a.start_time,
        a.end_time,
        a.room_label
      FROM "faculty_schema"."faculty_course_assignments" a
      JOIN "course_schema"."courses" c ON c.id = a.course_id
      WHERE a.status = 'ACCEPTED'
    `) as AcceptedAssignmentRow[];

    const acceptedByFaculty = acceptedAssignments.reduce<Record<string, AcceptedAssignmentRow[]>>(
      (acc, assignment) => {
        const row = acc[assignment.faculty_id] || [];
        row.push(assignment);
        acc[assignment.faculty_id] = row;
        return acc;
      },
      {}
    );

    return successResponse({
      faculty: facultyRows.map((faculty) => ({
        id: faculty.id,
        name: faculty.user.name,
        designation: faculty.designation,
        schedules: faculty.schedules.map((schedule) => ({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          courseCode: schedule.courseId ? (courseMap.get(schedule.courseId)?.code ?? "") : "",
          courseName: schedule.courseId ? (courseMap.get(schedule.courseId)?.name ?? "Unknown") : "Unknown",
          roomLabel: schedule.room ? `${schedule.room.building} ${schedule.room.name}` : "TBA",
          source: "BASE_TIMETABLE",
        })),
        acceptedAssignments: (acceptedByFaculty[faculty.id] || [])
          .filter((assignment) => assignment.day_of_week && assignment.start_time && assignment.end_time)
          .map((assignment) => ({
            id: `accepted-${assignment.id}`,
            dayOfWeek: assignment.day_of_week,
            startTime: assignment.start_time,
            endTime: assignment.end_time,
            courseCode: assignment.course_code,
            courseName: assignment.course_name,
            roomLabel: assignment.room_label || "TBA",
            source: "ACCEPTED_REQUEST",
          })),
      })),
    });
  } catch (error) {
    console.error("Scheduler timetable fetch error:", error);
    return internalErrorResponse("Failed to fetch scheduler timetable");
  }
}
