import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	internalErrorResponse,
	serviceUnavailableResponse,
	unauthorizedResponse,
} from "@/lib/api-response";
import { headers } from "next/headers";
export async function getAuthenticatedFaculty() {
	try {
		if (!auth) {
			return {
				error: serviceUnavailableResponse("Authentication service unavailable"),
			};
		}

		const headersList = await headers();
		const session = await auth.api.getSession({
			headers: headersList,
		});

		if (!session?.user) {
			return {
				error: unauthorizedResponse("Not authenticated"),
			};
		}

		if (!db) {
			return {
				error: serviceUnavailableResponse("Database not configured"),
			};
		}

		let faculty = await db.faculty.findUnique({
			where: { userId: session.user.id },
			include: {
				department: true,
				profile: true,
				availability: { include: { days: true } },
			},
		});

		if (!faculty) {
			let dept = await db.department.findFirst();
			if (!dept) {
				dept = await db.department.create({
					data: { name: "General", code: "GEN", description: "General Department" },
				});
			}

			faculty = await db.faculty.create({
				data: {
					userId: session.user.id,
					departmentId: dept.id,
					employeeId: `EMP-${Date.now()}`,
					designation: "Assistant Professor",
					joiningDate: new Date(),
					profile: { create: {} },
					availability: {
						create: {
							preferredSlot: "ANY",
							days: {
								create: [
									{ dayOfWeek: "MONDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "TUESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "WEDNESDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "THURSDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "FRIDAY", isAvailable: true, startTime: "09:00", endTime: "17:00" },
									{ dayOfWeek: "SATURDAY", isAvailable: false, startTime: null, endTime: null },
									{ dayOfWeek: "SUNDAY", isAvailable: false, startTime: null, endTime: null },
								],
							},
						},
					},
				},
				include: { department: true, profile: true, availability: { include: { days: true } } },
			});

			await db.facultyNotification.create({
				data: {
					facultyId: faculty.id,
					type: "SYSTEM",
					title: "Welcome to FacultyHub!",
					message: "Your account has been set up. Start by updating your profile and availability.",
					link: "/faculty/profile",
				},
			});
		}

		return { session, faculty };
	} catch (error) {
		console.error("Auth helper error:", error);
		return {
			error: internalErrorResponse("Authentication failed"),
		};
	}
}

export async function getServerSession() {
	try {
		if (!auth) {
			return null;
		}
		const headersList = await headers();
		return await auth.api.getSession({
			headers: headersList,
		});
	} catch {
		return null;
	}
}

export async function requireAuth() {
	const session = await getServerSession();
	if (!session?.user) {
		return null;
	}
	return session;
}

export async function requireFaculty() {
	const session = await getServerSession();
	if (!session?.user) {
		return null;
	}

	if (!db) {
		return null;
	}

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		include: { faculty: { include: { department: true, profile: true } } },
	});

	if (!user?.faculty) {
		return null;
	}

	if (user.role !== "STAFF" && user.role !== "ADMIN") {
		return null;
	}

	return { session, user, faculty: user.faculty };
}
