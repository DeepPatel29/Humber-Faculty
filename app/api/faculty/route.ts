import { NextRequest } from "next/server";
import { getSessionUser, requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  badRequestResponse,
  conflictResponse,
  createdResponse,
  internalErrorResponse,
  parseQueryParams,
  parseRequestBody,
  successResponse,
} from "@/lib/api-response";
import {
  createFacultyResourceSchema,
  facultyListQuerySchema,
} from "@/lib/validations/faculty";

/** Canonical list/create Faculty records (Phase 1 CRUD). */
export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const permErr = requirePermission(user, "faculty:read:list");
  if (permErr) return permErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const q = parseQueryParams(new URL(request.url).searchParams, facultyListQuerySchema);
  if (!q.success) return q.response;

  const { page, limit } = q.data;
  const skip = (page - 1) * limit;

  try {
    const [rows, total] = await Promise.all([
      db.faculty.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          department: true,
        },
      }),
      db.faculty.count(),
    ]);

    return successResponse({
      faculty: rows.map((f) => ({
        id: f.id,
        userId: f.userId,
        departmentId: f.departmentId,
        employeeId: f.employeeId,
        designation: f.designation,
        joiningDate: f.joiningDate.toISOString(),
        user: f.user,
        department: f.department,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    console.error("GET /api/faculty error:", e);
    return internalErrorResponse("Failed to list faculty");
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const permErr = requirePermission(user, "faculty:create");
  if (permErr) return permErr;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const parsed = await parseRequestBody(request, createFacultyResourceSchema);
  if (!parsed.success) return parsed.response;

  const { userId, departmentId, employeeId, designation, joiningDate } = parsed.data;

  try {
    const existingUser = await db.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return badRequestResponse("User not found");
    }

    const existingFaculty = await db.faculty.findUnique({ where: { userId } });
    if (existingFaculty) {
      return conflictResponse("User already has a faculty record");
    }

    const dept = await db.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return badRequestResponse("Department not found");
    }

    const created = await db.faculty.create({
      data: {
        userId,
        departmentId,
        employeeId,
        designation,
        joiningDate: joiningDate ?? new Date(),
        profile: { create: {} },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        profile: true,
      },
    });

    return createdResponse({
      faculty: {
        id: created.id,
        userId: created.userId,
        departmentId: created.departmentId,
        employeeId: created.employeeId,
        designation: created.designation,
        joiningDate: created.joiningDate.toISOString(),
        user: created.user,
        department: created.department,
        profile: created.profile,
      },
    });
  } catch (e) {
    console.error("POST /api/faculty error:", e);
    return internalErrorResponse("Failed to create faculty");
  }
}
