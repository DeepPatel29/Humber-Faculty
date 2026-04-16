import { NextRequest } from "next/server";
import { DayOfWeek, ScheduleItemType } from "@prisma/client";
import { getSessionUser, requireFacultyPortalAccess } from "@/lib/auth-helpers";
import { badRequestResponse, internalErrorResponse, successResponse } from "@/lib/api-response";
import { ensureCourseAssignmentTable } from "@/lib/course-assignment-store";
import { db, getSql } from "@/lib/db";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const authErr = requireFacultyPortalAccess(user);
  if (authErr) return authErr;

  if (!user?.facultyId) {
    return badRequestResponse("Faculty profile not found");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      status?: "ACCEPTED" | "REJECTED";
      note?: string;
    };
    if (body.status !== "ACCEPTED" && body.status !== "REJECTED") {
      return badRequestResponse("Status must be ACCEPTED or REJECTED");
    }

    await ensureCourseAssignmentTable();
    const { id } = await params;
    const sql = getSql();
    const rows = (await sql`
      SELECT
        id,
        faculty_id,
        course_id,
        term_label,
        academic_year,
        semester,
        section,
        program,
        day_of_week,
        start_time,
        end_time,
        room_id,
        class_type,
        status,
        faculty_schedule_id
      FROM "faculty_schema"."faculty_course_assignments"
      WHERE id = ${id}
        AND faculty_id = ${user.facultyId}
      LIMIT 1
    `) as Array<{
      id: string;
      faculty_id: string;
      course_id: number;
      term_label: string | null;
      academic_year: string | null;
      semester: number | null;
      section: string | null;
      program: string | null;
      day_of_week: string | null;
      start_time: string | null;
      end_time: string | null;
      room_id: string | null;
      class_type: string | null;
      status: string;
      faculty_schedule_id: string | null;
    }>;
    const assignment = rows[0];
    if (!assignment) {
      return badRequestResponse("Assignment not found");
    }
    if (assignment.status !== "PENDING") {
      return badRequestResponse("Only pending assignments can be updated");
    }

    let createdScheduleId: string | null = null;
    if (body.status === "ACCEPTED") {
      if (!db) {
        return internalErrorResponse("Database not configured");
      }
      if (
        !assignment.day_of_week ||
        !assignment.start_time ||
        !assignment.end_time
      ) {
        return badRequestResponse(
          "Assignment is missing day/time details required for timetable",
        );
      }
      const day = assignment.day_of_week.toUpperCase() as DayOfWeek;
      if (!Object.values(DayOfWeek).includes(day)) {
        return badRequestResponse("Invalid day_of_week on assignment");
      }
      const classTypeRaw = assignment.class_type?.toUpperCase() ?? "LECTURE";
      const classType = Object.values(ScheduleItemType).includes(
        classTypeRaw as ScheduleItemType,
      )
        ? (classTypeRaw as ScheduleItemType)
        : ScheduleItemType.LECTURE;

      const schedule = await db.facultySchedule.create({
        data: {
          facultyId: assignment.faculty_id,
          // Use current schema field; keep null to avoid cross-schema FK mismatch.
          sharedCourseId: null,
          facilityRoomId: assignment.room_id,
          dayOfWeek: day,
          startTime: assignment.start_time,
          endTime: assignment.end_time,
          type: classType,
          section: assignment.section,
          program: assignment.program,
          semester: assignment.semester,
          academicYear: assignment.academic_year ?? "2024-2025",
          schedulerTermId: assignment.term_label,
          isActive: true,
          assignmentStatus: "ACTIVE",
        },
      });
      createdScheduleId = schedule.id;
    }

    await sql`
      UPDATE "faculty_schema"."faculty_course_assignments"
      SET
        status = ${body.status},
        responded_at = NOW(),
        response_note = ${body.note ?? null},
        faculty_schedule_id = ${createdScheduleId ?? assignment.faculty_schedule_id}
      WHERE id = ${id}
        AND faculty_id = ${user.facultyId}
        AND status = 'PENDING'
    `;

    return successResponse({
      id,
      status: body.status,
      facultyScheduleId: createdScheduleId,
    });
  } catch (error) {
    console.error("Faculty course assignment update error:", error);
    return internalErrorResponse("Failed to update course assignment");
  }
}
