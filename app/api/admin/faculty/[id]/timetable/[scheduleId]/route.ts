import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import {
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/api-response";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

interface RouteCtx {
  params: Promise<{ id: string; scheduleId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  try {
    const { id, scheduleId } = await params;
    const existing = await db.facultySchedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, facultyId: true },
    });
    if (!existing || existing.facultyId !== id) {
      return notFoundResponse("Timetable entry");
    }

    await db.facultySchedule.delete({ where: { id: scheduleId } });
    return successResponse({ deleted: true, id: scheduleId });
  } catch (error) {
    console.error("Admin timetable delete error:", error);
    return internalErrorResponse("Failed to remove timetable entry");
  }
}
