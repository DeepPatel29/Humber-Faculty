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
	successResponse,
	validationErrorResponse,
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
						status: faculty.status,
						preferredSubjects: faculty.preferredSubjects.map((p) => ({
							id: p.id,
							subjectName: p.subjectName,
							createdAt: p.createdAt.toISOString(),
						})),
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

	const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	if (!rawBody || typeof rawBody !== "object") {
		return badRequestResponse("Invalid request body");
	}

	const normalizedBody: Record<string, unknown> = {
		...rawBody,
		fullName:
			typeof rawBody.fullName === "string" ? rawBody.fullName.trim() || undefined : rawBody.fullName,
		email: typeof rawBody.email === "string" ? rawBody.email.trim() || undefined : rawBody.email,
		designation:
			typeof rawBody.designation === "string"
				? rawBody.designation.trim() || undefined
				: rawBody.designation,
		departmentId:
			typeof rawBody.departmentId === "string"
				? rawBody.departmentId.trim() || undefined
				: rawBody.departmentId,
		phone: typeof rawBody.phone === "string" ? rawBody.phone.trim() || null : rawBody.phone,
		officeLocation:
			typeof rawBody.officeLocation === "string"
				? rawBody.officeLocation.trim()
				: rawBody.officeLocation,
		officeHours:
			typeof rawBody.officeHours === "string" ? rawBody.officeHours.trim() : rawBody.officeHours,
		researchInterests: Array.isArray(rawBody.researchInterests)
			? rawBody.researchInterests
					.filter((v): v is string => typeof v === "string")
					.map((v) => v.trim())
					.filter(Boolean)
			: rawBody.researchInterests,
		qualifications: Array.isArray(rawBody.qualifications)
			? rawBody.qualifications
					.filter((v): v is string => typeof v === "string")
					.map((v) => v.trim())
					.filter(Boolean)
			: rawBody.qualifications,
		publications: Array.isArray(rawBody.publications)
			? rawBody.publications
					.filter((v): v is string => typeof v === "string")
					.map((v) => v.trim())
					.filter(Boolean)
			: rawBody.publications,
		socialLinks:
			rawBody.socialLinks && typeof rawBody.socialLinks === "object"
				? Object.fromEntries(
						Object.entries(rawBody.socialLinks as Record<string, unknown>).filter(
							([, value]) => typeof value === "string" && value.trim().length > 0
						)
					)
				: rawBody.socialLinks,
	};

	const parsed = updateProfileSchema.safeParse(normalizedBody);
	if (!parsed.success) {
		return validationErrorResponse(parsed.error);
	}

	if (!db) {
		return internalErrorResponse("Database not configured");
	}

	const body = parsed.data;

	try {
		const faculty = await ensureFacultyExists(user!.id, user!.name, user!.email);
		if (!faculty) {
			return badRequestResponse("Could not resolve faculty record");
		}

		if (body.departmentId !== undefined && body.departmentId !== faculty.departmentId) {
			const department = await db.department.findUnique({ where: { id: body.departmentId } });
			if (!department) {
				return badRequestResponse("Department not found");
			}
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

		await db.faculty.update({
			where: { id: faculty.id },
			data: {
				...(body.designation !== undefined ? { designation: body.designation } : {}),
				...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
			},
		});

		if (body.fullName !== undefined || body.email !== undefined) {
			await db.user.update({
				where: { id: user!.id },
				data: {
					...(body.fullName !== undefined ? { name: body.fullName } : {}),
					...(body.email !== undefined ? { email: body.email } : {}),
				},
			});
		}

		const refreshed = await db.faculty.findUnique({
			where: { id: faculty.id },
			include: {
				profile: true,
				department: true,
				user: { select: { id: true, name: true, email: true, role: true } },
			},
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
					id: refreshed.user.id,
					name: refreshed.user.name,
					email: refreshed.user.email,
					role: refreshed.user.role,
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
