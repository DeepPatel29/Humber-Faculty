import { DayOfWeek } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import { activeFacultyScheduleWhere } from "@/lib/faculty-schedule-queries";
import { resolveCourseMap } from "@/lib/course-lookup";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

const WEEK_DAYS: DayOfWeek[] = [
	DayOfWeek.SUNDAY,
	DayOfWeek.MONDAY,
	DayOfWeek.TUESDAY,
	DayOfWeek.WEDNESDAY,
	DayOfWeek.THURSDAY,
	DayOfWeek.FRIDAY,
	DayOfWeek.SATURDAY,
];

const DAY_INDEX: Record<DayOfWeek, number> = {
	[DayOfWeek.SUNDAY]: 0,
	[DayOfWeek.MONDAY]: 1,
	[DayOfWeek.TUESDAY]: 2,
	[DayOfWeek.WEDNESDAY]: 3,
	[DayOfWeek.THURSDAY]: 4,
	[DayOfWeek.FRIDAY]: 5,
	[DayOfWeek.SATURDAY]: 6,
};

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty =
				(user!.facultyId
					? await db.faculty.findUnique({
							where: { id: user!.facultyId },
							include: { profile: true, department: true },
						})
					: null) ?? (await ensureFacultyExists(user!.id, user!.name, user!.email));
			if (faculty) {
				const todayDay = WEEK_DAYS[new Date().getDay()];

				const [allSchedules, pendingRequests, notifications] = await Promise.all([
					db.facultySchedule.findMany({
						where: activeFacultyScheduleWhere(faculty.id),
						orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
					}),
					db.facultyRequest.count({
						where: { facultyId: faculty.id, status: "PENDING" },
					}),
					db.facultyNotification.findMany({
						where: { facultyId: faculty.id },
						orderBy: { createdAt: "desc" },
						take: 4,
					}),
				]);
				const sql = (await import("@/lib/db")).getSql();
				const assignmentRows = (await sql`
					SELECT
						a.id,
						a.course_id,
						c.name AS course_name,
						c.code AS course_code,
						a.day_of_week,
						a.start_time,
						a.end_time,
						a.room_label,
						a.class_type
					FROM "faculty_schema"."faculty_course_assignments" a
					LEFT JOIN "course_schema"."courses" c ON c.id = a.course_id
					WHERE a.faculty_id = ${faculty.id}
					  AND a.status = 'ACCEPTED'
				`) as Array<{
					id: string;
					course_id: number | null;
					course_name: string | null;
					course_code: string | null;
					day_of_week: string | null;
					start_time: string | null;
					end_time: string | null;
					room_label: string | null;
					class_type: string | null;
				}>;

				const scheduleItems = allSchedules.map((s) => ({
					id: s.id,
					facultyId: s.facultyId,
					courseId: s.sharedCourseId ?? "",
					roomId: s.facilityRoomId ?? "",
					termId: s.schedulerTermId,
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					type: s.type,
					section: s.section || "",
					program: s.program || "",
					semester: s.semester,
					academicYear: s.academicYear,
					isActive: s.isActive,
					assignmentStatus: s.assignmentStatus,
					studentCount: s.studentCount,
					startDate: s.startDate?.toISOString() ?? null,
					endDate: s.endDate?.toISOString() ?? null,
					roomName: s.facilityRoomId ? "Room assigned" : "TBA",
					building: "",
					courseName: "",
					courseCode: "",
				}));
				const assignmentItems = assignmentRows
					.filter((a) => a.day_of_week && a.start_time && a.end_time)
					.map((a) => ({
						id: `assignment-${a.id}`,
						facultyId: faculty.id,
						courseId: a.course_id ? String(a.course_id) : "",
						roomId: "",
						termId: null as string | null,
						dayOfWeek: a.day_of_week as DayOfWeek,
						startTime: a.start_time as string,
						endTime: a.end_time as string,
						type: (a.class_type || "LECTURE") as string,
						section: "",
						program: "",
						semester: null as number | null,
						academicYear: "",
						isActive: true,
						assignmentStatus: "ACTIVE",
						studentCount: null as number | null,
						startDate: null as string | null,
						endDate: null as string | null,
						roomName: a.room_label || "TBA",
						building: "",
						courseName: a.course_name || "No course linked",
						courseCode: a.course_code || "",
					}));
				const existingSlotKeys = new Set(
					scheduleItems.map((s) => `${s.dayOfWeek}|${s.startTime}|${s.endTime}`)
				);
				const mergedItems = [
					...scheduleItems,
					...assignmentItems.filter(
						(a) => !existingSlotKeys.has(`${a.dayOfWeek}|${a.startTime}|${a.endTime}`)
					),
				];

				const allItems = mergedItems;
				const courseMap = await resolveCourseMap(
					allSchedules
						.map((s) => s.sharedCourseId)
						.filter((id): id is string => Boolean(id))
				);

				const formatSchedule = (items: typeof mergedItems) =>
					items.map((s) => ({
						...s,
						courseName:
							s.courseName ||
							(s.courseId && courseMap.get(s.courseId)?.name) ||
							"No course linked",
						courseCode:
							s.courseCode || (s.courseId && courseMap.get(s.courseId)?.code) || "",
					}));
				const todaySchedule = mergedItems.filter((s) => s.dayOfWeek === todayDay);

				return successResponse({
					faculty: {
						id: faculty.id,
						designation: faculty.designation,
						user: {
							name: user!.name,
							email: user!.email,
							avatarUrl: null,
						},
						department: {
							name: "General",
						},
					},
					summaryCards: [
						{
							label: "Classes This Week",
							value: mergedItems.length,
							change: 0,
							changeLabel: "vs last week",
							icon: "calendar",
						},
						{
							label: "Total Students",
							value: allSchedules.length * 30,
							change: 12,
							changeLabel: "new this semester",
							icon: "users",
						},
						{
							label: "Pending Requests",
							value: pendingRequests,
							change: -2,
							changeLabel: "vs last week",
							icon: "clock",
						},
						{
							label: "Office Hours",
							value: faculty.profile?.officeHours || "Not set",
							changeLabel: "this week",
							icon: "briefcase",
						},
					],
					todaySchedule: formatSchedule(todaySchedule),
					upcomingSchedule: formatSchedule(mergedItems.slice(0, 3)),
					recentNotifications: notifications.map((n) => ({
						id: n.id,
						type: n.type,
						title: n.title,
						message: n.message,
						isRead: n.isRead,
						link: n.link,
						createdAt: n.createdAt.toISOString(),
					})),
					classesThisWeek: mergedItems.length,
					pendingRequests,
				});
			}
		} catch (e) {
			console.error("Dashboard DB error:", e);
			return internalErrorResponse("Failed to load dashboard");
		}
	}

	return successResponse({
		faculty: {
			id: user!.id,
			designation: "Faculty",
			user: {
				name: user!.name,
				email: user!.email,
				avatarUrl: null,
			},
			department: {
				name: "General",
			},
		},
		summaryCards: [
			{ label: "Classes This Week", value: 0, change: 0, changeLabel: "vs last week", icon: "calendar" },
			{ label: "Total Students", value: 0, change: 0, changeLabel: "new this semester", icon: "users" },
			{ label: "Pending Requests", value: 0, change: 0, changeLabel: "vs last week", icon: "clock" },
			{ label: "Office Hours", value: "Not set", changeLabel: "this week", icon: "briefcase" },
		],
		todaySchedule: [],
		upcomingSchedule: [],
		recentNotifications: [],
		classesThisWeek: 0,
		pendingRequests: 0,
	});
}
