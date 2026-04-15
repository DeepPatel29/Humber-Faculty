import { NextRequest } from "next/server";
import { getSessionUser, requireFacultyPortalAccess } from "@/lib/auth-helpers";
import { badRequestResponse, internalErrorResponse, successResponse } from "@/lib/api-response";
import { ensureCourseAssignmentTable } from "@/lib/course-assignment-store";
import { getSql } from "@/lib/db";

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
    await sql`
      UPDATE "faculty_schema"."faculty_course_assignments"
      SET
        status = ${body.status},
        responded_at = NOW(),
        response_note = ${body.note ?? null}
      WHERE id = ${id}
        AND faculty_id = ${user.facultyId}
        AND status = 'PENDING'
    `;

    return successResponse({ id, status: body.status });
  } catch (error) {
    console.error("Faculty course assignment update error:", error);
    return internalErrorResponse("Failed to update course assignment");
  }
}
