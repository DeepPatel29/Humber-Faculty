import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

interface FacultyDepartmentRow {
  id: string;
  name: string;
  code: string | null;
}

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT
        id::text AS id,
        name,
        code
      FROM "faculty_schema"."Department"
      ORDER BY name ASC
    `) as FacultyDepartmentRow[];

    return successResponse({
      departments: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code ?? "",
      })),
      total: rows.length,
    });
  } catch (error) {
    console.error("Admin faculty departments fetch error:", error);
    return internalErrorResponse("Failed to fetch faculty departments");
  }
}
