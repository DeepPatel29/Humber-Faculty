import { NextRequest } from "next/server";
import { NotificationType, RequestStatus } from "@prisma/client";
import { getSessionUser, requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { hasPermission, ROLES } from "@/lib/types/roles";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
} from "@/lib/api-response";
import { patchFacultyRequestByIdSchema } from "@/lib/validations/faculty";

function parseMyScheduleIdFromDescription(description: string | null): string | null {
  if (!description) return null;
  const m = description.match(
    /myScheduleId:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return m?.[1] ?? null;
}

function scheduleToSummary(
  s: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    course: { code: string; name: string };
    room: { building: string; name: string };
    faculty: { user: { name: string } };
  } | null
): {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomLabel: string;
  ownerName: string | null;
} | null {
  if (!s) return null;
  return {
    id: s.id,
    courseCode: s.course.code,
    courseName: s.course.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    roomLabel: `${s.room.building} ${s.room.name}`,
    ownerName: s.faculty.user.name,
  };
}

function serializeRequest(r: {
  id: string;
  facultyId: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  requestDate: Date;
  effectiveDate: Date;
  endDate: Date | null;
  reason: string;
  targetFacultyId: string | null;
  targetScheduleId: string | null;
  newDate: Date | null;
  newStartTime: string | null;
  newEndTime: string | null;
  createdAt: Date;
  updatedAt: Date;
  timeline: Array<{
    id: string;
    requestId: string;
    status: string;
    comment: string | null;
    createdAt: Date;
    createdBy: string;
  }>;
}) {
  return {
    id: r.id,
    facultyId: r.facultyId,
    type: r.type,
    status: r.status,
    title: r.title,
    description: r.description,
    requestDate: (r.requestDate || r.effectiveDate).toISOString(),
    effectiveDate: r.effectiveDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    reason: r.reason,
    targetFacultyId: r.targetFacultyId,
    targetScheduleId: r.targetScheduleId,
    newDate: r.newDate?.toISOString() ?? null,
    newStartTime: r.newStartTime,
    newEndTime: r.newEndTime,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    timeline: r.timeline.map((t) => ({
      id: t.id,
      requestId: t.requestId,
      status: t.status,
      comment: t.comment,
      createdAt: t.createdAt.toISOString(),
      createdBy: t.createdBy,
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const { id } = await params;

  try {
    const existing = await db.facultyRequest.findUnique({
      where: { id },
      include: {
        timeline: { orderBy: { createdAt: "asc" } },
        faculty: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!existing) {
      return notFoundResponse("Request");
    }

    if (user!.role === ROLES.STUDENT) {
      return forbiddenResponse("Students cannot access faculty requests");
    }

    if (user!.role === ROLES.SCHEDULER) {
      return forbiddenResponse("Schedulers cannot access faculty request details");
    }

    const isOwner =
      user!.role === ROLES.STAFF && user!.facultyId !== undefined && existing.facultyId === user!.facultyId;
    const isAdmin = user!.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return forbiddenResponse("You cannot access this request");
    }

    const scheduleInclude = {
      course: true,
      room: true,
      faculty: { include: { user: { select: { name: true } } } },
    } as const;

    const myScheduleId = parseMyScheduleIdFromDescription(existing.description);

    const [targetFacultyRow, targetScheduleRow, myScheduleRow] = await Promise.all([
      existing.targetFacultyId
        ? db.faculty.findUnique({
            where: { id: existing.targetFacultyId },
            include: { user: { select: { name: true, email: true } } },
          })
        : Promise.resolve(null),
      existing.targetScheduleId
        ? db.facultySchedule.findUnique({
            where: { id: existing.targetScheduleId },
            include: scheduleInclude,
          })
        : Promise.resolve(null),
      myScheduleId
        ? db.facultySchedule.findUnique({
            where: { id: myScheduleId },
            include: scheduleInclude,
          })
        : Promise.resolve(null),
    ]);

    const base = serializeRequest(existing);
    return successResponse({
      ...base,
      faculty: {
        id: existing.faculty.id,
        name: existing.faculty.user.name,
        email: existing.faculty.user.email,
        designation: existing.faculty.designation,
        employeeId: existing.faculty.employeeId,
        departmentName: existing.faculty.department?.name ?? "—",
      },
      targetFaculty: targetFacultyRow
        ? {
            id: targetFacultyRow.id,
            name: targetFacultyRow.user.name,
            email: targetFacultyRow.user.email,
            designation: targetFacultyRow.designation,
          }
        : null,
      targetSchedule: scheduleToSummary(targetScheduleRow),
      mySchedule: scheduleToSummary(myScheduleRow),
    });
  } catch (e) {
    console.error("GET faculty request error:", e);
    return internalErrorResponse("Failed to load request");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getSessionUser(req);
  const authError = requireAuth(user);
  if (authError) return authError;

  if (!db) {
    return internalErrorResponse("Database not configured");
  }

  const parsed = await parseRequestBody(req, patchFacultyRequestByIdSchema);
  if (!parsed.success) return parsed.response;

  const { status: newStatus, comment } = parsed.data;
  const { id } = await params;

  if (user!.role === ROLES.STUDENT || user!.role === ROLES.SCHEDULER) {
    return forbiddenResponse("Read-only role cannot modify requests");
  }

  try {
    const existing = await db.facultyRequest.findUnique({
      where: { id },
      include: { faculty: { include: { user: true } } },
    });

    if (!existing) {
      return notFoundResponse("Request");
    }

    if (user!.role === ROLES.STAFF) {
      if (user!.facultyId !== existing.facultyId) {
        return forbiddenResponse("You can only update your own requests");
      }
      if (newStatus !== RequestStatus.WITHDRAWN) {
        return forbiddenResponse("Staff can only withdraw requests");
      }
      if (existing.status !== RequestStatus.PENDING) {
        return badRequestResponse("Only pending requests can be withdrawn");
      }
    }

    if (
      (newStatus === RequestStatus.APPROVED || newStatus === RequestStatus.REJECTED) &&
      !hasPermission(user!.role, "requests:approve")
    ) {
      return forbiddenResponse("Only admins can approve or reject requests");
    }

    const updated = await db.facultyRequest.update({
      where: { id },
      data: {
        status: newStatus,
        timeline: {
          create: {
            status: newStatus,
            comment:
              comment ||
              `Status changed to ${newStatus} by ${user!.name}`,
            createdBy: user!.name,
          },
        },
      },
      include: { timeline: { orderBy: { createdAt: "asc" } } },
    });

    if (
      newStatus === RequestStatus.APPROVED ||
      newStatus === RequestStatus.REJECTED
    ) {
      await db.facultyNotification.create({
        data: {
          facultyId: existing.facultyId,
          type: NotificationType.REQUEST_UPDATE,
          title: `Request ${newStatus}`,
          message: `Your ${existing.type.toLowerCase()} request has been ${newStatus.toLowerCase()}.`,
          isRead: false,
          link: "/faculty/requests",
        },
      });
    }

    return successResponse(serializeRequest(updated));
  } catch (e) {
    console.error("PUT faculty request error:", e);
    return internalErrorResponse("Failed to update request");
  }
}
