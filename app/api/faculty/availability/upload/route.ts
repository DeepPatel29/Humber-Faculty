import { NextRequest } from "next/server";
import {
  getSessionUser,
  requireAuth,
  requireFacultyPortalAccess,
} from "@/lib/auth-helpers";
import {
  successResponse,
  internalErrorResponse,
  badRequestResponse,
} from "@/lib/api-response";
import { parseAvailabilityFile, validateFile } from "@/lib/timetable-parser";
import {
  replaceFacultyAvailability,
  notifyAdminsOfUpload,
} from "@/lib/services/timetable-upload-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { user } = await getSessionUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  const portalErr = requireFacultyPortalAccess(user);
  if (portalErr) return portalErr;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const confirm = formData.get("confirm") === "true";

    if (!file) {
      return badRequestResponse("No file uploaded");
    }

    const validation = validateFile(file.name, file.size);
    if (!validation.isValid) {
      return badRequestResponse(validation.errors.join("; "));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await parseAvailabilityFile(buffer, file.name);

    if (!parseResult.success) {
      return successResponse({
        ...parseResult,
        message: "Failed to parse availability file",
      });
    }

    if (!confirm) {
      return successResponse({
        ...parseResult,
        message: "File parsed successfully. Confirm to apply changes.",
        requiresConfirmation: true,
      });
    }

    if (!parseResult.preview || parseResult.preview.days.length === 0) {
      return badRequestResponse("No valid availability entries to import");
    }

    const userName = user?.name || "";
    const userEmail = user?.email || "";

    const uploadResult = await replaceFacultyAvailability(
      user!.id,
      userName,
      userEmail,
      parseResult.preview.days,
      parseResult.preview.preferredSlot,
      parseResult.preview.courseCodes,
    );

    await notifyAdminsOfUpload(
      user!.id,
      user!.name || "Faculty",
      uploadResult.daysUpdated,
      file.name,
    );

    return successResponse({
      success: true,
      filename: file.name,
      daysUpdated: uploadResult.daysUpdated,
      coursesUpdated: uploadResult.coursesUpdated,
      warnings: [...parseResult.warnings, ...uploadResult.warnings],
      message: `Successfully updated availability for ${uploadResult.daysUpdated} days and ${uploadResult.coursesUpdated} courses`,
    });
  } catch (error) {
    console.error("Availability upload error:", error);
    return internalErrorResponse(
      error instanceof Error
        ? error.message
        : "Failed to process availability upload",
    );
  }
}
