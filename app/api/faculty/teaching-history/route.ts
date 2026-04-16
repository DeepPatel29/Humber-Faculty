import { NextRequest } from "next/server";
import {
  getSessionUser,
  requireAuth,
  requireFacultyPortalAccess,
  requirePermission,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
  createdResponse,
  internalErrorResponse,
  parseRequestBody,
  successResponse,
} from "@/lib/api-response";
import { createTeachingHistorySchema } from "@/lib/validations/faculty";

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

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  try {
    const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
    if (!faculty) {
      return internalErrorResponse("Could not resolve faculty record");
    }

    const rows = await db.facultyTeachingHistory.findMany({
      where: { facultyId: faculty.id },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({
      teachingHistory: rows.map(serializeTeachingHistory),
    });
  } catch (e) {
    console.error("GET teaching history error:", e);
    return internalErrorResponse("Failed to load teaching history");
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const permError = requirePermission(user, "profile:edit:own");
  if (permError) return permError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const parsed = await parseRequestBody(request, createTeachingHistorySchema);
  if (!parsed.success) return parsed.response;

  try {
    const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
    if (!faculty) {
      return internalErrorResponse("Could not resolve faculty record");
    }

    const created = await db.facultyTeachingHistory.create({
      data: {
        facultyId: faculty.id,
        institutionName: parsed.data.institutionName,
        courseTitle: parsed.data.courseTitle,
        subjectArea: parsed.data.subjectArea ?? null,
        termLabel: parsed.data.termLabel ?? null,
        academicYear: parsed.data.academicYear ?? null,
        startDate: toDateOrNull(parsed.data.startDate),
        endDate: toDateOrNull(parsed.data.endDate),
        studentCount: parsed.data.studentCount ?? null,
        notes: parsed.data.notes ?? null,
        isExternal: parsed.data.isExternal ?? true,
      },
    });

    return createdResponse({
      teachingHistory: serializeTeachingHistory(created),
    });
  } catch (e) {
    console.error("POST teaching history error:", e);
    return internalErrorResponse("Failed to create teaching history entry");
  }
}
