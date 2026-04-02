import {
	type FacultyProfile,
	type FacultyAvailability,
	type FacultyRequest,
	type FacultyNotification,
	type FacultyAvailabilityDay,
	PreferredSlot,
	RequestStatus,
	RequestType,
	NotificationType,
	DayOfWeek,
} from "@/lib/types/faculty";

interface UserStore {
	profile: FacultyProfile;
	availability: FacultyAvailability;
	requests: FacultyRequest[];
	notifications: FacultyNotification[];
	scheduleIds: string[];
}

const userDataStore = new Map<string, UserStore>();

function createEmptyProfile(
	userId: string,
	name: string,
	email: string
): FacultyProfile {
	return {
		id: `profile_${userId}`,
		facultyId: userId,
		bio: null,
		phone: null,
		officeLocation: null,
		officeHours: null,
		researchInterests: [],
		qualifications: [],
		publications: [],
		socialLinks: {},
	};
}

function createEmptyAvailability(userId: string): FacultyAvailability {
	return {
		id: `availability_${userId}`,
		facultyId: userId,
		preferredSlot: PreferredSlot.ANY,
		customStartTime: null,
		customEndTime: null,
		unavailableStart: null,
		unavailableEnd: null,
		notes: null,
		days: [
			{ id: `day_mon_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.MONDAY, isAvailable: true },
			{ id: `day_tue_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.TUESDAY, isAvailable: true },
			{ id: `day_wed_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.WEDNESDAY, isAvailable: true },
			{ id: `day_thu_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.THURSDAY, isAvailable: true },
			{ id: `day_fri_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.FRIDAY, isAvailable: true },
			{ id: `day_sat_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.SATURDAY, isAvailable: false },
			{ id: `day_sun_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.SUNDAY, isAvailable: false },
		],
	};
}

function createDemoStore(userId: string): UserStore {
	return {
		profile: {
			id: `profile_${userId}`,
			facultyId: userId,
			bio: "Dr. John Smith is an Associate Professor specializing in Machine Learning and Artificial Intelligence. With over 15 years of research experience, he has published extensively in top-tier conferences and journals.",
			phone: "+1-555-123-4567",
			officeLocation: "Engineering Building, Room 405",
			officeHours: "Mon & Wed: 2:00 PM - 4:00 PM, Fri: 10:00 AM - 12:00 PM",
			researchInterests: [
				"Machine Learning",
				"Deep Learning",
				"Natural Language Processing",
				"Computer Vision",
			],
			qualifications: [
				"Ph.D. in Computer Science, MIT (2010)",
				"M.S. in Computer Science, Stanford (2006)",
				"B.Tech in Computer Engineering, IIT Delhi (2004)",
			],
			publications: [
				"Smith, J. et al. (2023). 'Advances in Neural Architecture Search'. NeurIPS.",
				"Smith, J. & Doe, A. (2022). 'Efficient Transformers for Edge Devices'. ICML.",
				"Smith, J. (2021). 'Survey of Modern Deep Learning Techniques'. IEEE TPAMI.",
			],
			socialLinks: {
				linkedin: "https://linkedin.com/in/drjohnsmith",
				github: "https://github.com/jsmith",
				googleScholar: "https://scholar.google.com/citations?user=jsmith",
			},
		},
		availability: {
			id: `availability_${userId}`,
			facultyId: userId,
			preferredSlot: PreferredSlot.MORNING,
			customStartTime: "08:00",
			customEndTime: "16:00",
			unavailableStart: "12:00",
			unavailableEnd: "13:00",
			notes: "Lunch break: 12:00-13:00. Research meetings on Wednesday afternoons.",
			days: [
				{ id: `day_mon_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.MONDAY, isAvailable: true },
				{ id: `day_tue_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.TUESDAY, isAvailable: true },
				{ id: `day_wed_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.WEDNESDAY, isAvailable: true },
				{ id: `day_thu_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.THURSDAY, isAvailable: true },
				{ id: `day_fri_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.FRIDAY, isAvailable: true },
				{ id: `day_sat_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.SATURDAY, isAvailable: false },
				{ id: `day_sun_${userId}`, availabilityId: `availability_${userId}`, dayOfWeek: DayOfWeek.SUNDAY, isAvailable: false },
			],
		},
		requests: [
			{
				id: `req_swap_${userId}`,
				facultyId: userId,
				type: RequestType.SWAP,
				status: RequestStatus.PENDING,
				title: "Swap CS501 Monday class with Dr. Jane Doe",
				description: "Requesting to swap Monday 9:00 AM class due to research meeting conflict.",
				requestDate: new Date(Date.now() - 86400000),
				effectiveDate: new Date(Date.now() + 7 * 86400000),
				endDate: null,
				targetFacultyId: "faculty-2",
				targetScheduleId: "schedule-10",
				newDate: null,
				newStartTime: null,
				newEndTime: null,
				reason: "I have an important research collaboration meeting that conflicts with this time slot.",
				createdAt: new Date(Date.now() - 86400000),
				updatedAt: new Date(Date.now() - 86400000),
				timeline: [
					{
						id: `timeline_1_${userId}`,
						requestId: `req_swap_${userId}`,
						status: RequestStatus.PENDING,
						comment: "Request submitted",
						createdBy: userId,
						createdAt: new Date(Date.now() - 86400000),
					},
				],
			},
		],
		notifications: [
			{
				id: `notif_1_${userId}`,
				facultyId: userId,
				type: NotificationType.REQUEST_UPDATE,
				title: "Request Approved",
				message: "Your reschedule request for CS601 Lab has been approved.",
				isRead: false,
				link: "/faculty/requests",
				createdAt: new Date(Date.now() - 86400000 * 2),
			},
			{
				id: `notif_2_${userId}`,
				facultyId: userId,
				type: NotificationType.SCHEDULE_CHANGE,
				title: "Room Change",
				message: "CS501 Monday class has been moved to LH-102 due to maintenance.",
				isRead: false,
				link: "/faculty/timetable",
				createdAt: new Date(Date.now() - 86400000 * 3),
			},
			{
				id: `notif_3_${userId}`,
				facultyId: userId,
				type: NotificationType.ANNOUNCEMENT,
				title: "Department Meeting",
				message: "Reminder: Faculty meeting scheduled for Friday at 3:00 PM.",
				isRead: true,
				link: null,
				createdAt: new Date(Date.now() - 86400000 * 4),
			},
		],
		scheduleIds: ["schedule-1", "schedule-2", "schedule-3", "schedule-4", "schedule-5", "schedule-6"],
	};
}

function createWelcomeNotification(userId: string): FacultyNotification {
	return {
		id: `notif_welcome_${userId}`,
		facultyId: userId,
		type: NotificationType.SYSTEM,
		title: "Welcome to FacultyHub!",
		message: "Your account has been created. Please complete your profile to get started.",
		isRead: false,
		link: "/faculty/profile",
		createdAt: new Date(),
	};
}

export function getUserStore(
	userId: string,
	name?: string,
	email?: string
): UserStore {
	if (!userDataStore.has(userId)) {
		const isDemoUser =
			email?.includes("john.smith") ||
			name?.toLowerCase().includes("john smith");

		if (isDemoUser) {
			userDataStore.set(userId, createDemoStore(userId));
		} else {
			userDataStore.set(userId, {
				profile: createEmptyProfile(userId, name || "", email || ""),
				availability: createEmptyAvailability(userId),
				requests: [],
				notifications: [createWelcomeNotification(userId)],
				scheduleIds: [],
			});
		}
	}
	return userDataStore.get(userId)!;
}

export function updateUserProfile(
	userId: string,
	updates: Partial<FacultyProfile>
): FacultyProfile {
	const store = getUserStore(userId);
	store.profile = { ...store.profile, ...updates };
	userDataStore.set(userId, store);
	return store.profile;
}

export function updateUserAvailability(
	userId: string,
	updates: Partial<FacultyAvailability>
): FacultyAvailability {
	const store = getUserStore(userId);
	store.availability = { ...store.availability, ...updates };
	userDataStore.set(userId, store);
	return store.availability;
}

export function updateUserAvailabilityDays(
	userId: string,
	days: FacultyAvailabilityDay[]
): FacultyAvailability {
	const store = getUserStore(userId);
	store.availability = { ...store.availability, days };
	userDataStore.set(userId, store);
	return store.availability;
}

export function addUserRequest(
	userId: string,
	request: Omit<FacultyRequest, "id" | "facultyId" | "createdAt" | "updatedAt">
): FacultyRequest {
	const store = getUserStore(userId);
	const timeline = request.timeline || [];
	const newRequest: FacultyRequest = {
		...request,
		id: `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
		facultyId: userId,
		createdAt: new Date(),
		updatedAt: new Date(),
		timeline,
	};
	store.requests = [newRequest, ...store.requests];
	userDataStore.set(userId, store);
	return newRequest;
}

export function updateUserRequest(
	userId: string,
	requestId: string,
	updates: Partial<FacultyRequest>
): FacultyRequest | null {
	const store = getUserStore(userId);
	const idx = store.requests.findIndex((r) => r.id === requestId);
	if (idx === -1) return null;
	store.requests[idx] = {
		...store.requests[idx],
		...updates,
		updatedAt: new Date(),
	};
	userDataStore.set(userId, store);
	return store.requests[idx];
}

export function markUserNotificationRead(userId: string, notifId: string): void {
	const store = getUserStore(userId);
	const notif = store.notifications.find((n) => n.id === notifId);
	if (notif) {
		notif.isRead = true;
		userDataStore.set(userId, store);
	}
}

export function markAllUserNotificationsRead(userId: string): void {
	const store = getUserStore(userId);
	store.notifications.forEach((n) => (n.isRead = true));
	userDataStore.set(userId, store);
}

export function addUserNotification(
	userId: string,
	notification: Omit<FacultyNotification, "id" | "facultyId" | "createdAt">
): FacultyNotification {
	const store = getUserStore(userId);
	const newNotif: FacultyNotification = {
		...notification,
		id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
		facultyId: userId,
		createdAt: new Date(),
	};
	store.notifications = [newNotif, ...store.notifications];
	userDataStore.set(userId, store);
	return newNotif;
}

export function getUserNotificationCount(userId: string): number {
	const store = getUserStore(userId);
	return store.notifications.filter((n) => !n.isRead).length;
}
