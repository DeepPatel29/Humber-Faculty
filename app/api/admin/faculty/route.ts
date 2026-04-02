import { NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/types/roles";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
	const { user } = await getSessionUser(_request);
	const roleError = requireRole(user, ROLES.ADMIN);
	if (roleError) return roleError;

	if (!db) {
		return successResponse({ faculty: [], total: 0 });
	}

	try {
		const faculty = await db.faculty.findMany({
			include: {
				user: true,
				department: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return successResponse({
			faculty: faculty.map((f) => ({
				id: f.id,
				name: f.user.name,
				email: f.user.email,
				designation: f.designation,
				department: f.department?.name || "Unknown",
				role: f.user.role,
				joiningDate: f.joiningDate.toISOString(),
			})),
			total: faculty.length,
		});
	} catch (error) {
		console.error("Admin faculty fetch error:", error);
		return internalErrorResponse("Failed to fetch faculty");
	}
}
