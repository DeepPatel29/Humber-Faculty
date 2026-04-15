import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

interface CourseSchemaDepartmentRow {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  try {
    const rows = (await getSql()`
      SELECT id, name, code, created_at, updated_at
      FROM course_schema.departments
      ORDER BY name ASC
    `) as CourseSchemaDepartmentRow[];

    return successResponse({
      total: rows.length,
      departments: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("Admin course_schema departments fetch error:", error);
    return internalErrorResponse("Failed to fetch course schema departments");
  }
}
