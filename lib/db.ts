import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

// ============================================================================
// Raw SQL helper (for lightweight queries via Neon HTTP driver)
// ============================================================================

export const sql = neon(process.env.DATABASE_URL!);

// ============================================================================
// Prisma Client Singleton
// ============================================================================

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
	if (!process.env.DATABASE_URL) {
		console.warn("DATABASE_URL is not set — database features are disabled.");
		return null;
	}

	try {
		const client = new PrismaClient({
			log:
				process.env.NODE_ENV === "development"
					? ["warn", "error"]
					: ["error"],
		});
		return client;
	} catch (e) {
		console.error("Failed to create PrismaClient:", e);
		return null;
	}
}

export const db: PrismaClient | null = (() => {
	if (globalForPrisma.prisma) return globalForPrisma.prisma;

	const client = createPrismaClient();
	if (client && process.env.NODE_ENV !== "production") {
		globalForPrisma.prisma = client;
	}
	return client;
})();

// ============================================================================
// Helper: Ensure a Faculty record exists for a given user
// ============================================================================

export async function ensureFacultyExists(
	userId: string,
	name: string,
	email: string
) {
	if (!db) return null;
	try {
		let faculty = await db.faculty.findUnique({
			where: { userId },
			include: { profile: true, department: true, preferredSubjects: true },
		});

		if (!faculty) {
			let dept = await db.department.findFirst({
				where: { code: "GENERAL" },
			});
			if (!dept) {
				dept = await db.department.create({
					data: {
						name: "General",
						code: "GENERAL",
						description: "Default department",
					},
				});
			}

			faculty = await db.faculty.create({
				data: {
					userId,
					departmentId: dept.id,
					employeeId: `EMP-${userId.slice(-8).toUpperCase()}`,
					designation: "Faculty",
					joiningDate: new Date(),
					profile: {
						create: {
							bio: "",
							phone: "",
							officeLocation: "",
							officeHours: "",
							researchInterests: [],
							qualifications: [],
							publications: [],
							socialLinks: {},
						},
					},
				},
				include: { profile: true, department: true, preferredSubjects: true },
			});
		}
		return faculty;
	} catch (e) {
		console.error("ensureFacultyExists error:", e);
		return null;
	}
}

// ============================================================================
// Date Helpers
// ============================================================================

export function getCurrentDayOfWeek(): string {
	const days = [
		"SUNDAY",
		"MONDAY",
		"TUESDAY",
		"WEDNESDAY",
		"THURSDAY",
		"FRIDAY",
		"SATURDAY",
	];
	return days[new Date().getDay()];
}

export function getWeekDates(startDate?: Date): { start: Date; end: Date } {
	const date = startDate || new Date();
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	const start = new Date(date.setDate(diff));
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return { start, end };
}
