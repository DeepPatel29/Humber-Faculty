import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { internalErrorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (!db) {
		return internalErrorResponse("Database not configured");
	}

	try {
		const departments = await db.department.findMany({
			select: { id: true, name: true, code: true },
			orderBy: { name: "asc" },
		});

		return successResponse({ departments });
	} catch (e) {
		console.error("Departments options error:", e);
		return internalErrorResponse("Failed to load departments");
	}
}
