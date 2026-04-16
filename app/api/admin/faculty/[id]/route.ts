import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { internalErrorResponse, notFoundResponse, successResponse } from "@/lib/api-response";
import { ROLES } from "@/lib/types/roles";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  try {
    const existing = await db.faculty.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Faculty");

    await db.faculty.delete({ where: { id } });
    return successResponse({ deleted: true, id });
  } catch (error) {
    console.error("Admin faculty delete error:", error);
    return internalErrorResponse("Failed to delete faculty");
  }
}
