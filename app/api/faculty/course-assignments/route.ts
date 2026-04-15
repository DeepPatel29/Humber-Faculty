import { NextRequest } from "next/server";
import { getSessionUser, requireFacultyPortalAccess } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { ensureCourseAssignmentTable, type CourseAssignmentRow } from "@/lib/course-assignment-store";
import { getSql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const authErr = requireFacultyPortalAccess(user);
  if (authErr) return authErr;

  if (!user?.facultyId) {
    return successResponse({ assignments: [], total: 0 });
  }

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
      WHERE a.faculty_id = ${user.facultyId}
      ORDER BY a.assigned_at DESC
    `) as CourseAssignmentRow[];

    return successResponse({ assignments: rows, total: rows.length });
  } catch (error) {
    console.error("Faculty course assignments fetch error:", error);
    return internalErrorResponse("Failed to fetch course assignments");
  }
}
