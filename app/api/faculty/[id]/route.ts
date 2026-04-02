import { NextRequest } from "next/server";
import { getSessionUser, requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/types/roles";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { updateFacultyResourceSchema } from "@/lib/validations/faculty";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(_request);
  const permErr = requirePermission(user, "faculty:read:one");
  if (permErr) return permErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  try {
    const row = await db.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        profile: true,
      },
    });

    if (!row) {
      return notFoundResponse("Faculty");
    }

    return successResponse({
      faculty: {
        id: row.id,
        userId: row.userId,
        departmentId: row.departmentId,
        employeeId: row.employeeId,
        designation: row.designation,
        joiningDate: row.joiningDate.toISOString(),
        user: row.user,
        department: row.department,
        profile: row.profile,
      },
    });
  } catch (e) {
    console.error("GET /api/faculty/[id] error:", e);
    return internalErrorResponse("Failed to load faculty");
  }
}

export async function PUT(request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  const canEditAny = hasPermission(user.role, "faculty:update:any");
  const canEditOwn = hasPermission(user.role, "faculty:update:own");

  if (!canEditAny && !canEditOwn) {
    return forbiddenResponse("You cannot update faculty records");
  }

  if (!canEditAny && canEditOwn && user.facultyId !== id) {
    return forbiddenResponse("You can only update your own faculty profile");
  }

  const parsed = await parseRequestBody(request, updateFacultyResourceSchema);
  if (!parsed.success) return parsed.response;

  try {
    const existing = await db.faculty.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse("Faculty");
    }

    const updated = await db.faculty.update({
      where: { id },
      data: {
        ...(parsed.data.departmentId !== undefined && {
          departmentId: parsed.data.departmentId,
        }),
        ...(parsed.data.employeeId !== undefined && { employeeId: parsed.data.employeeId }),
        ...(parsed.data.designation !== undefined && { designation: parsed.data.designation }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        profile: true,
      },
    });

    return successResponse({
      faculty: {
        id: updated.id,
        userId: updated.userId,
        departmentId: updated.departmentId,
        employeeId: updated.employeeId,
        designation: updated.designation,
        joiningDate: updated.joiningDate.toISOString(),
        user: updated.user,
        department: updated.department,
        profile: updated.profile,
      },
    });
  } catch (e) {
    console.error("PUT /api/faculty/[id] error:", e);
    return internalErrorResponse("Failed to update faculty");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const { user } = await getSessionUser(_request);
  const permErr = requirePermission(user, "faculty:delete");
  if (permErr) return permErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  try {
    const existing = await db.faculty.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse("Faculty");
    }

    await db.faculty.delete({ where: { id } });

    return successResponse({ deleted: true, id });
  } catch (e) {
    console.error("DELETE /api/faculty/[id] error:", e);
    return internalErrorResponse("Failed to delete faculty");
  }
}
