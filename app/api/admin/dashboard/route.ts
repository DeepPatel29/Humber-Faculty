import { RequestStatus, RequestType } from "@prisma/client";
import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { internalErrorResponse, successResponse } from "@/lib/api-response";
import { db, getSql } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";

function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

export async function GET(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const roleError = requireRole(user, ROLES.ADMIN);
  if (roleError) return roleError;

  if (!db) {
    return internalErrorResponse("Database is not configured");
  }

  try {
    const { start, end } = getCurrentWeekBounds();
    const departmentsResult = (await getSql()`
      SELECT COUNT(*) FROM "course_schema"."departments";
    `) as Array<{ count: string | number }>;
    const totalDepartments = Number(departmentsResult[0]?.count ?? 0);

    const [
      pendingRequests,
      pendingBreakdownRaw,
      totalFaculty,
      approvedThisWeek,
      recentRequestsRaw,
    ] = await Promise.all([
      db.facultyRequest.count({
        where: { status: RequestStatus.PENDING },
      }),
      db.facultyRequest.groupBy({
        by: ["type"],
        where: { status: RequestStatus.PENDING },
        _count: { _all: true },
      }),
      db.faculty.count(),
      db.facultyRequest.count({
        where: {
          status: RequestStatus.APPROVED,
          updatedAt: {
            gte: start,
            lt: end,
          },
        },
      }),
      db.facultyRequest.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          faculty: {
            include: {
              user: true,
            },
          },
        },
      }),
    ]);

    const pendingBreakdown = {
      swap: 0,
      reschedule: 0,
      leave: 0,
    };

    for (const row of pendingBreakdownRaw) {
      if (row.type === RequestType.SWAP) pendingBreakdown.swap = row._count._all;
      if (row.type === RequestType.RESCHEDULE) pendingBreakdown.reschedule = row._count._all;
      if (row.type === RequestType.LEAVE) pendingBreakdown.leave = row._count._all;
    }

    return successResponse({
      pendingRequests,
      pendingBreakdown,
      totalFaculty,
      totalDepartments,
      approvedThisWeek,
      recentRequests: recentRequestsRaw.map((requestItem: (typeof recentRequestsRaw)[number]) => ({
        id: requestItem.id,
        type: requestItem.type,
        status: requestItem.status,
        createdAt: requestItem.createdAt.toISOString(),
        facultyName: requestItem.faculty.user.name,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    return internalErrorResponse("Failed to fetch dashboard data");
  }
}
