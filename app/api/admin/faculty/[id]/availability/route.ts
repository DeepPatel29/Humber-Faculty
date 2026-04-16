import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, notFoundResponse, successResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  try {
    const { id } = await params;
    const faculty = await db.faculty.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!faculty) {
      return notFoundResponse("Faculty");
    }

    const availability = await db.facultyAvailability.findUnique({
      where: { facultyId: id },
      include: {
        days: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!availability) {
      return successResponse({ availability: null });
    }

    return successResponse({
      availability: {
        id: availability.id,
        preferredSlot: availability.preferredSlot,
        customStartTime: availability.customStartTime,
        customEndTime: availability.customEndTime,
        unavailableStart: availability.unavailableStart,
        unavailableEnd: availability.unavailableEnd,
        notes: availability.notes,
        days: availability.days.map((day) => ({
          id: day.id,
          dayOfWeek: day.dayOfWeek,
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      },
    });
  } catch (error) {
    console.error("Admin faculty availability fetch error:", error);
    return internalErrorResponse("Failed to fetch faculty availability");
  }
}
