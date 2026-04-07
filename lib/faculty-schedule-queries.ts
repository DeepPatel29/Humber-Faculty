import { AssignmentStatus, type Prisma } from "@prisma/client";

/**
 * Current / in-flight teaching assignments: keeps legacy `isActive` aligned with
 * `assignmentStatus` until all writers use the enum exclusively.
 */
export function activeFacultyScheduleWhere(
	facultyId: string,
	extra?: Prisma.FacultyScheduleWhereInput
): Prisma.FacultyScheduleWhereInput {
	return {
		facultyId,
		isActive: true,
		assignmentStatus: { in: [AssignmentStatus.PLANNED, AssignmentStatus.ACTIVE] },
		...extra,
	};
}

/** Completed teaching history (single source of truth: FacultySchedule). */
export function completedFacultyScheduleWhere(
	facultyId: string,
	extra?: Prisma.FacultyScheduleWhereInput
): Prisma.FacultyScheduleWhereInput {
	return {
		facultyId,
		assignmentStatus: AssignmentStatus.COMPLETED,
		...extra,
	};
}
