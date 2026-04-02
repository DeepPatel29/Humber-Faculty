import { NextRequest } from "next/server";
import {
	getSessionUser,
	requireAuth,
	requireFacultyPortalAccess,
	requirePermission,
} from "@/lib/auth-helpers";
import { db, ensureFacultyExists } from "@/lib/db";
import {
	badRequestResponse,
	internalErrorResponse,
	parseRequestBody,
	successResponse,
} from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validations/faculty";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requireAuth(user);
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	if (db) {
		try {
			const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
			if (faculty) {
				const profile = faculty.profile;
				const dept = faculty.department;
				return successResponse({
					faculty: {
						id: faculty.id,
						userId: user!.id,
						departmentId: faculty.departmentId,
						employeeId: faculty.employeeId,
						designation: faculty.designation,
						joiningDate: faculty.joiningDate?.toISOString() || "",
						user: {
							id: user!.id,
							name: user!.name,
							email: user!.email,
							role: user!.role,
							avatarUrl: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						department: {
							id: dept?.id || "",
							name: dept?.name || "General",
							code: dept?.code || "GENERAL",
							description: dept?.description || null,
						},
					},
					profile: {
						id: profile?.id || "",
						facultyId: faculty.id,
						bio: profile?.bio || "",
						phone: profile?.phone || "",
						officeLocation: profile?.officeLocation || "",
						officeHours: profile?.officeHours || "",
						researchInterests: profile?.researchInterests || [],
						qualifications: profile?.qualifications || [],
						publications: profile?.publications || [],
						socialLinks: (profile?.socialLinks as Record<string, string>) || {},
					},
				});
			}
		} catch (e) {
			console.error("GET profile DB error:", e);
			return internalErrorResponse("Failed to load profile");
		}
	}

	return internalErrorResponse("Database not configured");
}

export async function PUT(request: NextRequest) {
	const { user } = await getSessionUser(request);
	const authError = requirePermission(user, "profile:edit:own");
	if (authError) return authError;

	const portalErr = requireFacultyPortalAccess(user);
	if (portalErr) return portalErr;

	const parsed = await parseRequestBody(request, updateProfileSchema);
	if (!parsed.success) return parsed.response;

	if (!db) {
		return internalErrorResponse("Database not configured");
	}

	const body = parsed.data;

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
		if (!faculty) {
			return badRequestResponse("Could not resolve faculty record");
		}

		const updateData: Prisma.FacultyProfileUpdateInput = {};
		if (body.bio !== undefined) updateData.bio = body.bio ?? "";
		if (body.phone !== undefined) updateData.phone = body.phone ?? "";
		if (body.officeLocation !== undefined) updateData.officeLocation = body.officeLocation ?? "";
		if (body.officeHours !== undefined) updateData.officeHours = body.officeHours ?? "";
		if (body.researchInterests !== undefined) updateData.researchInterests = body.researchInterests;
		if (body.qualifications !== undefined) updateData.qualifications = body.qualifications;
		if (body.publications !== undefined) updateData.publications = body.publications;
		if (body.socialLinks !== undefined) {
			updateData.socialLinks = body.socialLinks as Prisma.InputJsonValue;
		}

		await db.facultyProfile.upsert({
			where: { facultyId: faculty.id },
			create: {
				facultyId: faculty.id,
				bio: body.bio ?? "",
				phone: body.phone ?? "",
				officeLocation: body.officeLocation ?? "",
				officeHours: body.officeHours ?? "",
				researchInterests: body.researchInterests ?? [],
				qualifications: body.qualifications ?? [],
				publications: body.publications ?? [],
				socialLinks: (body.socialLinks ?? {}) as Prisma.InputJsonValue,
			},
			update: updateData,
		});

		if (body.designation) {
			await db.faculty.update({
				where: { id: faculty.id },
				data: { designation: body.designation },
			});
		}

		const refreshed = await db.faculty.findUnique({
			where: { id: faculty.id },
			include: { profile: true, department: true },
		});

		if (!refreshed) {
			return internalErrorResponse("Failed to refresh profile");
		}

		return successResponse({
			faculty: {
				id: refreshed.id,
				userId: user!.id,
				departmentId: refreshed.departmentId,
				employeeId: refreshed.employeeId,
				designation: refreshed.designation,
				joiningDate: refreshed.joiningDate?.toISOString() || "",
				user: {
					id: user!.id,
					name: user!.name,
					email: user!.email,
					role: user!.role,
					avatarUrl: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				department: {
					id: refreshed.department?.id || "",
					name: refreshed.department?.name || "General",
					code: refreshed.department?.code || "GENERAL",
					description: refreshed.department?.description || null,
				},
			},
			profile: {
				id: refreshed.profile?.id || "",
				facultyId: refreshed.id,
				bio: refreshed.profile?.bio || "",
				phone: refreshed.profile?.phone || "",
				officeLocation: refreshed.profile?.officeLocation || "",
				officeHours: refreshed.profile?.officeHours || "",
				researchInterests: refreshed.profile?.researchInterests || [],
				qualifications: refreshed.profile?.qualifications || [],
				publications: refreshed.profile?.publications || [],
				socialLinks: (refreshed.profile?.socialLinks as Record<string, string>) || {},
			},
		});
	} catch (e) {
		console.error("PUT profile DB error:", e);
		return internalErrorResponse("Database error while updating profile");
	}
}
