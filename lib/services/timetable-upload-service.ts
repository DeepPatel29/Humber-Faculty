import { db, ensureFacultyExists } from "@/lib/db";
import type {
  DayOfWeek,
  ScheduleItemType,
  AppRole,
  PreferredSlot,
} from "@prisma/client";
import type { ParsedTimetableEntry } from "@/lib/types/timetable-upload";
import type { ParsedAvailabilityDay } from "@/lib/timetable-parser";

interface ScheduleCreateInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseId: string | null;
  roomId: string | null;
  type: ScheduleItemType;
  section: string | null;
  program: string | null;
  semester: number | null;
  academicYear: string;
  isActive: boolean;
}

interface UploadResult {
  entriesCreated: number;
  entriesDeleted: number;
  warnings: string[];
}

export async function resolveCourseId(
  courseCode?: string,
  courseName?: string,
): Promise<string | null> {
  if (!db) return null;

  if (courseCode) {
    const byCode = await db.sharedCourse.findFirst({
      where: { code: { equals: courseCode, mode: "insensitive" } },
      select: { id: true },
    });
    if (byCode) return String(byCode.id);
  }

  if (courseName) {
    const byName = await db.sharedCourse.findFirst({
      where: { name: { contains: courseName, mode: "insensitive" } },
      select: { id: true },
    });
    if (byName) return String(byName.id);
  }

  return null;
}

export async function resolveRoomId(
  roomNumber?: string,
  building?: string,
): Promise<string | null> {
  if (!db) return null;

  if (roomNumber) {
    const room = await db.room.findFirst({
      where: {
        name: { equals: roomNumber, mode: "insensitive" },
        ...(building && {
          building: { equals: building, mode: "insensitive" },
        }),
      },
      select: { id: true },
    });
    if (room) return room.id;
  }

  return null;
}

export async function replaceFacultyTimetable(
  userId: string,
  name: string | null,
  email: string | null,
  entries: ParsedTimetableEntry[],
): Promise<UploadResult> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const faculty = await ensureFacultyExists(userId, name || "", email || "");
  if (!faculty) {
    throw new Error("Could not resolve faculty record");
  }

  const warnings: string[] = [];
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const existingCount = await db.facultySchedule.count({
    where: { facultyId: faculty.id },
  });

  const scheduleInputs: ScheduleCreateInput[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const courseId = await resolveCourseId(entry.courseCode, entry.courseName);
    if (!courseId && (entry.courseCode || entry.courseName)) {
      warnings.push(
        `Entry ${i + 1}: Course "${entry.courseCode || entry.courseName}" not found, saved without course reference`,
      );
    }

    const roomId = await resolveRoomId(entry.roomNumber, entry.building);
    if (!roomId && entry.roomNumber) {
      warnings.push(
        `Entry ${i + 1}: Room "${entry.roomNumber}" not found, saved as TBA`,
      );
    }

    scheduleInputs.push({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      courseId,
      roomId,
      type: entry.type,
      section: entry.section || null,
      program: entry.program || null,
      semester: entry.semester || null,
      academicYear,
      isActive: true,
    });
  }

  await db.$transaction(async (tx) => {
    await tx.facultySchedule.deleteMany({
      where: { facultyId: faculty.id },
    });

    if (scheduleInputs.length > 0) {
      await tx.facultySchedule.createMany({
        data: scheduleInputs.map((s) => ({
          ...s,
          facultyId: faculty.id,
        })),
      });
    }
  });

  return {
    entriesCreated: scheduleInputs.length,
    entriesDeleted: existingCount,
    warnings,
  };
}

export async function notifyAdminsOfUpload(
  facultyId: string,
  facultyName: string,
  entryCount: number,
  filename: string,
): Promise<void> {
  if (!db) return;

  const admins = await db.user.findMany({
    where: { role: "ADMIN" as AppRole },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await db.facultyNotification.createMany({
    data: admins.map((admin) => ({
      facultyId: admin.id,
      type: "SCHEDULE_CHANGE",
      title: "Faculty Timetable Updated",
      message: `${facultyName} uploaded a new timetable (${filename}) with ${entryCount} entries.`,
      link: `/admin/faculty/${facultyId}`,
    })),
  });
}

// ============================================================================
// Availability Upload
// ============================================================================

interface AvailabilityUploadResult {
  daysUpdated: number;
  coursesUpdated: number;
  warnings: string[];
}

export async function replaceFacultyAvailability(
  userId: string,
  name: string | null,
  email: string | null,
  days: ParsedAvailabilityDay[],
  preferredSlot?: string,
  _courseCodes?: string[],
): Promise<AvailabilityUploadResult> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const faculty = await ensureFacultyExists(userId, name || "", email || "");
  if (!faculty) {
    throw new Error("Could not resolve faculty record");
  }

  const warnings: string[] = [];

  // Map days to DB format
  const dayInputs = days.map((d) => ({
    facultyId: faculty.id,
    dayOfWeek: d.dayOfWeek as DayOfWeek,
    isAvailable: d.isAvailable,
    startTime: d.startTime || null,
    endTime: d.endTime || null,
  }));

  // Get preferred slot enum
  let slotEnum: PreferredSlot | undefined;
  if (preferredSlot) {
    const slotMap: Record<string, PreferredSlot> = {
      MORNING: "MORNING" as PreferredSlot,
      AFTERNOON: "AFTERNOON" as PreferredSlot,
      EVENING: "EVENING" as PreferredSlot,
      ANY: "ANY" as PreferredSlot,
    };
    slotEnum = slotMap[preferredSlot];
  }

  // Get or create availability record and update
  await db.$transaction(async (tx) => {
    // Find existing availability or create new
    let availability = await tx.facultyAvailability.findUnique({
      where: { facultyId: faculty.id },
    });

    if (!availability) {
      availability = await tx.facultyAvailability.create({
        data: {
          facultyId: faculty.id,
          preferredSlot: slotEnum || "ANY",
          notes: "",
        },
      });
    } else {
      // Update existing
      await tx.facultyAvailability.update({
        where: { id: availability.id },
        data: {
          preferredSlot: slotEnum || availability.preferredSlot,
        },
      });
    }

    // Delete existing day entries and create new ones
    await tx.facultyAvailabilityDay.deleteMany({
      where: { availabilityId: availability.id },
    });

    if (dayInputs.length > 0) {
      await tx.facultyAvailabilityDay.createMany({
        data: dayInputs.map((d) => ({
          ...d,
          availabilityId: availability!.id,
        })),
      });
    }
  });

  return {
    daysUpdated: dayInputs.filter((d) => d.isAvailable).length,
    coursesUpdated: 0,
    warnings,
  };
}
