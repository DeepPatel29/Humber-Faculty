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
		const [localDepartments, sharedDepartments] = await Promise.all([
			db.department.findMany({
				select: { id: true, name: true, code: true },
				orderBy: { name: "asc" },
			}),
			db.sharedDepartment.findMany({
				select: { id: true, name: true, code: true },
			}),
		]);

		const sharedByCode = new Map(
			sharedDepartments.map((d) => [d.code.trim().toUpperCase(), d] as const)
		);

		// Keep local UUID ids for safe writes, but source display labels from shared departments by code.
		const departments = localDepartments.map((d) => {
			const shared = sharedByCode.get(d.code.trim().toUpperCase());
			return {
				id: d.id,
				name: shared?.name ?? d.name,
				code: shared?.code ?? d.code,
			};
		});

		return successResponse({ departments });
	} catch (e) {
		console.error("Departments options error:", e);
		return internalErrorResponse("Failed to load departments");
	}
}
