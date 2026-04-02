import { DayOfWeek } from "@prisma/client";
import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
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

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const todayDay = WEEK_DAYS[new Date().getDay()];

				const todaySchedule = await db.facultySchedule.findMany({
					where: { facultyId: faculty.id, dayOfWeek: todayDay, isActive: true },
					include: { course: true, room: true },
					orderBy: { startTime: "asc" },
				});

				const allSchedules = await db.facultySchedule.findMany({
					where: { facultyId: faculty.id, isActive: true },
					include: { course: true, room: true },
					orderBy: { startTime: "asc" },
					take: 6,
				});

				const pendingRequests = await db.facultyRequest.count({
					where: { facultyId: faculty.id, status: "PENDING" },
				});

				const notifications = await db.facultyNotification.findMany({
					where: { facultyId: faculty.id },
					orderBy: { createdAt: "desc" },
					take: 4,
				});

				const formatSchedule = (items: typeof allSchedules) =>
					items.map((s) => ({
						id: s.id,
						facultyId: s.facultyId,
						courseId: s.courseId,
						roomId: s.roomId,
						courseName: s.course?.name || "Unknown",
						courseCode: s.course?.code || "",
						dayOfWeek: s.dayOfWeek,
						startTime: s.startTime,
						endTime: s.endTime,
						roomName: s.room?.name || "TBA",
						building: s.room?.building || "",
						type: s.type,
						section: s.section || "",
						program: s.program || "",
						semester: s.semester,
						academicYear: s.academicYear,
						isActive: s.isActive,
					}));

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
							name: faculty.department?.name || "General",
						},
					},
					summaryCards: [
						{
							label: "Classes This Week",
							value: allSchedules.length,
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
					upcomingSchedule: formatSchedule(allSchedules.slice(0, 3)),
					recentNotifications: notifications.map((n) => ({
						id: n.id,
						type: n.type,
						title: n.title,
						message: n.message,
						isRead: n.isRead,
						link: n.link,
						createdAt: n.createdAt.toISOString(),
					})),
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
		pendingRequests: 0,
	});
}
