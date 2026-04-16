import { NextRequest } from "next/server";
import {
  getSessionUser,
  requirePermission,
  requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
  internalErrorResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
} from "@/lib/api-response";
import { updateTeachingHistorySchema } from "@/lib/validations/faculty";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeTeachingHistory(item: {
  id: string;
  facultyId: string;
  institutionName: string;
  courseTitle: string;
  subjectArea: string | null;
  termLabel: string | null;
  academicYear: string | null;
  startDate: Date | null;
  endDate: Date | null;
  studentCount: number | null;
  notes: string | null;
  isExternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    facultyId: item.facultyId,
    institutionName: item.institutionName,
    courseTitle: item.courseTitle,
    subjectArea: item.subjectArea,
    termLabel: item.termLabel,
    academicYear: item.academicYear,
    startDate: item.startDate?.toISOString() ?? null,
    endDate: item.endDate?.toISOString() ?? null,
    studentCount: item.studentCount,
    notes: item.notes,
    isExternal: item.isExternal,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function PUT(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const permError = requirePermission(user, "profile:edit:own");
  if (permError) return permError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const parsed = await parseRequestBody(request, updateTeachingHistorySchema);
  if (!parsed.success) return parsed.response;

  const { id } = await params;

  try {
    const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
    if (!faculty) {
      return internalErrorResponse("Could not resolve faculty record");
    }

    const existing = await db.facultyTeachingHistory.findFirst({
      where: { id, facultyId: faculty.id },
    });
    if (!existing) {
      return notFoundResponse("Teaching history entry");
    }

    const updated = await db.facultyTeachingHistory.update({
      where: { id },
      data: {
        ...(parsed.data.institutionName !== undefined && {
          institutionName: parsed.data.institutionName,
        }),
        ...(parsed.data.courseTitle !== undefined && {
          courseTitle: parsed.data.courseTitle,
        }),
        ...(parsed.data.subjectArea !== undefined && {
          subjectArea: parsed.data.subjectArea ?? null,
        }),
        ...(parsed.data.termLabel !== undefined && {
          termLabel: parsed.data.termLabel ?? null,
        }),
        ...(parsed.data.academicYear !== undefined && {
          academicYear: parsed.data.academicYear ?? null,
        }),
        ...(parsed.data.startDate !== undefined && {
          startDate: toDateOrNull(parsed.data.startDate),
        }),
        ...(parsed.data.endDate !== undefined && {
          endDate: toDateOrNull(parsed.data.endDate),
        }),
        ...(parsed.data.studentCount !== undefined && {
          studentCount: parsed.data.studentCount ?? null,
        }),
        ...(parsed.data.notes !== undefined && {
          notes: parsed.data.notes ?? null,
        }),
        ...(parsed.data.isExternal !== undefined && {
          isExternal: parsed.data.isExternal,
        }),
      },
    });

    return successResponse({
      teachingHistory: serializeTeachingHistory(updated),
    });
  } catch (e) {
    console.error("PUT teaching history error:", e);
    return internalErrorResponse("Failed to update teaching history entry");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  const permError = requirePermission(user, "profile:edit:own");
  if (permError) return permError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  try {
    const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
    if (!faculty) {
      return internalErrorResponse("Could not resolve faculty record");
    }

    const existing = await db.facultyTeachingHistory.findFirst({
      where: { id, facultyId: faculty.id },
      select: { id: true },
    });
    if (!existing) {
      return notFoundResponse("Teaching history entry");
    }

    await db.facultyTeachingHistory.delete({ where: { id } });

    return successResponse({ deleted: true, id });
  } catch (e) {
    console.error("DELETE teaching history error:", e);
    return internalErrorResponse("Failed to delete teaching history entry");
  }
}
