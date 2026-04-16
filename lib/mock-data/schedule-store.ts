import {
	type FacultyScheduleItem,
	type Course,
	type Room,
	DayOfWeek,
	ScheduleItemType,
	AssignmentStatus,
} from "@/lib/types/faculty";

const userSchedules = new Map<string, FacultyScheduleItem[]>();

const DEMO_COURSES: Course[] = [
	{ id: "course-1", name: "Machine Learning", code: "CS501", description: null, credits: 4, departmentId: "dept-1" },
	{ id: "course-2", name: "Deep Learning", code: "CS601", description: null, credits: 3, departmentId: "dept-1" },
	{ id: "course-3", name: "Data Structures", code: "CS201", description: null, credits: 4, departmentId: "dept-1" },
	{ id: "course-4", name: "Algorithms", code: "CS301", description: null, credits: 4, departmentId: "dept-1" },
];

const DEMO_ROOMS: Room[] = [
	{ id: "room-1", name: "LH-101", building: "Engineering", floor: 1, capacity: 100, type: "lecture_hall" },
	{ id: "room-2", name: "Lab-201", building: "Engineering", floor: 2, capacity: 40, type: "computer_lab" },
	{ id: "room-3", name: "CR-301", building: "Engineering", floor: 3, capacity: 50, type: "classroom" },
	{ id: "room-4", name: "Seminar-401", building: "Engineering", floor: 4, capacity: 30, type: "seminar_room" },
];

const DEMO_SCHEDULES: FacultyScheduleItem[] = [
	{
		id: "schedule-1",
		facultyId: "demo",
		courseId: "course-1",
		roomId: "room-1",
		termId: null,
		dayOfWeek: DayOfWeek.MONDAY,
		startTime: "09:00",
		endTime: "10:30",
		type: ScheduleItemType.LECTURE,
		section: "A",
		program: "B.Tech",
		semester: 5,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[0],
		room: DEMO_ROOMS[0],
	},
	{
		id: "schedule-2",
		facultyId: "demo",
		courseId: "course-2",
		roomId: "room-2",
		termId: null,
		dayOfWeek: DayOfWeek.MONDAY,
		startTime: "14:00",
		endTime: "15:30",
		type: ScheduleItemType.LAB,
		section: "A",
		program: "M.Tech",
		semester: 1,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[1],
		room: DEMO_ROOMS[1],
	},
	{
		id: "schedule-3",
		facultyId: "demo",
		courseId: "course-1",
		roomId: "room-1",
		termId: null,
		dayOfWeek: DayOfWeek.TUESDAY,
		startTime: "11:00",
		endTime: "12:30",
		type: ScheduleItemType.LECTURE,
		section: "B",
		program: "B.Tech",
		semester: 5,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[0],
		room: DEMO_ROOMS[0],
	},
	{
		id: "schedule-4",
		facultyId: "demo",
		courseId: "course-3",
		roomId: "room-3",
		termId: null,
		dayOfWeek: DayOfWeek.WEDNESDAY,
		startTime: "09:00",
		endTime: "10:30",
		type: ScheduleItemType.LECTURE,
		section: "A",
		program: "B.Tech",
		semester: 3,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[2],
		room: DEMO_ROOMS[2],
	},
	{
		id: "schedule-5",
		facultyId: "demo",
		courseId: "course-4",
		roomId: "room-4",
		termId: null,
		dayOfWeek: DayOfWeek.THURSDAY,
		startTime: "14:00",
		endTime: "15:30",
		type: ScheduleItemType.SEMINAR,
		section: null,
		program: "Ph.D",
		semester: null,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[3],
		room: DEMO_ROOMS[3],
	},
	{
		id: "schedule-6",
		facultyId: "demo",
		courseId: "course-2",
		roomId: "room-1",
		termId: null,
		dayOfWeek: DayOfWeek.FRIDAY,
		startTime: "10:00",
		endTime: "11:30",
		type: ScheduleItemType.LECTURE,
		section: "A",
		program: "M.Tech",
		semester: 1,
		academicYear: "2024-25",
		isActive: true,
		assignmentStatus: AssignmentStatus.ACTIVE,
		studentCount: null,
		startDate: null,
		endDate: null,
		course: DEMO_COURSES[1],
		room: DEMO_ROOMS[0],
	},
];

export function getUserSchedule(
	userId: string,
	email?: string,
	name?: string
): FacultyScheduleItem[] {
	if (!userSchedules.has(userId)) {
		const isDemoUser =
			email?.includes("john.smith") ||
			name?.toLowerCase().includes("john smith");

		if (isDemoUser) {
			const userSchedule = DEMO_SCHEDULES.map((s) => ({
				...s,
				facultyId: userId,
			}));
			userSchedules.set(userId, userSchedule);
		} else {
			userSchedules.set(userId, []);
		}
	}
	return userSchedules.get(userId)!;
}

export function getTodaySchedule(
	userId: string,
	email?: string,
	name?: string
): FacultyScheduleItem[] {
	const schedule = getUserSchedule(userId, email, name);
	const DAYS = [
		DayOfWeek.SUNDAY,
		DayOfWeek.MONDAY,
		DayOfWeek.TUESDAY,
		DayOfWeek.WEDNESDAY,
		DayOfWeek.THURSDAY,
		DayOfWeek.FRIDAY,
		DayOfWeek.SATURDAY,
	];
	const today = DAYS[new Date().getDay()];
	return schedule.filter((s) => s.dayOfWeek === today);
}

export function getUpcomingClasses(
	userId: string,
	email?: string,
	name?: string,
	limit = 4
): FacultyScheduleItem[] {
	const schedule = getUserSchedule(userId, email, name);
	return schedule.slice(0, limit);
}

export const ALL_COURSES = [
	{ id: "course-1", name: "Machine Learning", code: "CS501" },
	{ id: "course-2", name: "Deep Learning", code: "CS601" },
	{ id: "course-3", name: "Data Structures", code: "CS201" },
	{ id: "course-4", name: "Algorithms", code: "CS301" },
	{ id: "course-5", name: "Database Systems", code: "CS401" },
	{ id: "course-6", name: "Computer Networks", code: "CS402" },
	{ id: "course-7", name: "Operating Systems", code: "CS403" },
	{ id: "course-8", name: "Software Engineering", code: "CS404" },
	{ id: "course-9", name: "Artificial Intelligence", code: "CS502" },
	{ id: "course-10", name: "Computer Vision", code: "CS602" },
];

const userEligibility = new Map<string, string[]>();

export function getUserEligibility(userId: string): string[] {
	return userEligibility.get(userId) || [];
}

export function setUserEligibility(userId: string, courseIds: string[]): void {
	userEligibility.set(userId, courseIds);
}
