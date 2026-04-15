import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { badRequestResponse, internalErrorResponse, successResponse } from "@/lib/api-response";
import { ensureCourseAssignmentTable, type CourseAssignmentRow } from "@/lib/course-assignment-store";
import { getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  try {
    await ensureCourseAssignmentTable();
    const sql = getSql();
    const rows = (await sql`
      SELECT
        a.id,
        a.faculty_id,
        u.name AS faculty_name,
        u.email AS faculty_email,
        a.course_id,
        c.code AS course_code,
        c.name AS course_name,
        a.day_of_week,
        a.start_time,
        a.end_time,
        a.room_id,
        a.room_label,
        a.class_type,
        a.status,
        a.assigned_by,
        a.assigned_at::text,
        a.responded_at::text,
        a.response_note
      FROM "faculty_schema"."faculty_course_assignments" a
      JOIN "faculty_schema"."Faculty" f ON f.id::text = a.faculty_id
      JOIN "faculty_schema"."User" u ON u.id = f."userId"
      JOIN "course_schema"."courses" c ON c.id = a.course_id
      ORDER BY a.assigned_at DESC
    `) as CourseAssignmentRow[];
    return successResponse({ assignments: rows, total: rows.length });
  } catch (error) {
    console.error("Admin course assignments fetch error:", error);
    return internalErrorResponse("Failed to fetch course assignments");
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  try {
    await ensureCourseAssignmentTable();
    const body = (await request.json().catch(() => ({}))) as {
      facultyId?: string;
      courseId?: number;
      dayOfWeek?: string;
      startTime?: string;
      endTime?: string;
      roomId?: string;
      roomLabel?: string;
      classType?: string;
      note?: string;
    };
    const facultyId = body.facultyId?.trim();
    const courseId = Number(body.courseId);
    if (!facultyId || !Number.isInteger(courseId)) {
      return badRequestResponse("facultyId and numeric courseId are required");
    }

    const sql = getSql();
    const facultyExists = (await sql`
      SELECT id::text AS id
      FROM "faculty_schema"."Faculty"
      WHERE id::text = ${facultyId}
      LIMIT 1
    `) as Array<{ id: string }>;
    if (!facultyExists.length) {
      return badRequestResponse("Faculty not found");
    }

    const courseExists = (await sql`
      SELECT id
      FROM "course_schema"."courses"
      WHERE id = ${courseId}
      LIMIT 1
    `) as Array<{ id: number }>;
    if (!courseExists.length) {
      return badRequestResponse("Course not found");
    }

    const id = randomUUID();
    await sql`
      INSERT INTO "faculty_schema"."faculty_course_assignments" (
        id, faculty_id, course_id, day_of_week, start_time, end_time, room_id, room_label, class_type, status, assigned_by, response_note
      ) VALUES (
        ${id}, ${facultyId}, ${courseId}, ${body.dayOfWeek ?? null}, ${body.startTime ?? null}, ${body.endTime ?? null}, ${body.roomId ?? null}, ${body.roomLabel ?? null}, ${body.classType ?? "LECTURE"}, 'PENDING', ${user!.id}, ${body.note ?? null}
      )
    `;
    return successResponse({
      id,
      facultyId,
      courseId,
      dayOfWeek: body.dayOfWeek ?? null,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      roomId: body.roomId ?? null,
      roomLabel: body.roomLabel ?? null,
      classType: body.classType ?? "LECTURE",
      status: "PENDING",
    }, 201);
  } catch (error) {
    console.error("Admin course assignment create error:", error);
    return internalErrorResponse("Failed to assign course");
  }
}
