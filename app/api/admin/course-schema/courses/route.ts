import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

interface CourseSchemaCourseRow {
  id: number;
  code: string;
  name: string;
  status: string;
  credits: number;
  program_id: number | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const normalizedStatus = statusParam?.trim().toUpperCase();
    const sqlClient = getSql();

    const rows = normalizedStatus
      ? ((await sqlClient`
          SELECT id, code, name, status, credits, program_id, created_at, updated_at
          FROM course_schema.courses
          WHERE status = ${normalizedStatus}
          ORDER BY code ASC
        `) as CourseSchemaCourseRow[])
      : ((await sqlClient`
          SELECT id, code, name, status, credits, program_id, created_at, updated_at
          FROM course_schema.courses
          ORDER BY code ASC
        `) as CourseSchemaCourseRow[]);

    return successResponse({
      total: rows.length,
      courses: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.status,
        credits: row.credits,
        programId: row.program_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("Admin course_schema courses fetch error:", error);
    return internalErrorResponse("Failed to fetch course schema courses");
  }
}
