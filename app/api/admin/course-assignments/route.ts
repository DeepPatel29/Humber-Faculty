import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { badRequestResponse, internalErrorResponse, successResponse } from "@/lib/api-response";
import { ensureCourseAssignmentTable, type CourseAssignmentRow } from "@/lib/course-assignment-store";
import { getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

const DAY_VALUES = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

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
        a.request_title,
        a.course_id,
        c.code AS course_code,
        c.name AS course_name,
        a.term_label,
        a.academic_year,
        a.semester,
        a.section,
        a.program,
        a.day_of_week,
        a.start_time,
        a.end_time,
        a.room_id,
        a.room_label,
        a.class_type,
        a.status,
        a.faculty_schedule_id,
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
      requestTitle?: string;
      termLabel?: string;
      academicYear?: string;
      semester?: number;
      section?: string;
      program?: string;
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
    const requestTitle = body.requestTitle?.trim();
    const termLabel = body.termLabel?.trim();
    const academicYear = body.academicYear?.trim();
    const semester = body.semester ? Number(body.semester) : null;
    const dayOfWeek = body.dayOfWeek?.trim().toUpperCase();
    const startTime = body.startTime?.trim();
    const endTime = body.endTime?.trim();
    if (!facultyId || !Number.isInteger(courseId)) {
      return badRequestResponse("facultyId and numeric courseId are required");
    }
    if (!requestTitle) {
      return badRequestResponse("requestTitle is required");
    }
    if (!termLabel) {
      return badRequestResponse("termLabel is required");
    }
    if (!academicYear) {
      return badRequestResponse("academicYear is required");
    }
    if (!dayOfWeek || !startTime || !endTime) {
      return badRequestResponse("dayOfWeek, startTime, and endTime are required");
    }
    if (!DAY_VALUES.has(dayOfWeek)) {
      return badRequestResponse("Invalid dayOfWeek");
    }
    if (startTime >= endTime) {
      return badRequestResponse("startTime must be before endTime");
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
        id, faculty_id, request_title, course_id, term_label, academic_year, semester, section, program, day_of_week, start_time, end_time, room_id, room_label, class_type, status, assigned_by, response_note
      ) VALUES (
        ${id}, ${facultyId}, ${requestTitle}, ${courseId}, ${termLabel}, ${academicYear}, ${semester}, ${body.section ?? null}, ${body.program ?? null}, ${dayOfWeek}, ${startTime}, ${endTime}, ${body.roomId ?? null}, ${body.roomLabel ?? null}, ${body.classType ?? "LECTURE"}, 'PENDING', ${user!.id}, ${body.note ?? null}
      )
    `;
    return successResponse({
      id,
      facultyId,
      requestTitle,
      courseId,
      termLabel,
      academicYear,
      semester,
      section: body.section ?? null,
      program: body.program ?? null,
      dayOfWeek,
      startTime,
      endTime,
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
