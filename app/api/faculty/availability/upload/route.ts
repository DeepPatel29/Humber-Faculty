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

    // Try to also parse as a timetable to see if we can update the schedule at the same time
    const { parseTimetableFile } = await import("@/lib/timetable-parser");
    const { replaceFacultyTimetable } = await import("@/lib/services/timetable-upload-service");
    const timetableResult = await parseTimetableFile(buffer, file.name);

    if (!confirm) {
      return successResponse({
        ...parseResult,
        hasTimetableData: timetableResult.success && timetableResult.entriesParsed > 0,
        timetableEntries: timetableResult.entriesParsed,
        message: "File parsed successfully. Confirm to apply changes.",
        requiresConfirmation: true,
      });
    }

    if (!parseResult.preview || (parseResult.preview.days.length === 0 && (!timetableResult.success || timetableResult.entriesParsed === 0))) {
      return badRequestResponse("No valid entries found to import");
    }

    const userName = user?.name || "";
    const userEmail = user?.email || "";

    // 1. Update Availability
    const uploadResult = await replaceFacultyAvailability(
      user!.id,
      userName,
      userEmail,
      parseResult.preview.days,
      parseResult.preview.preferredSlot,
      parseResult.preview.courseCodes,
    );

    // 2. Update Timetable if present
    let timetableUpdated = 0;
    if (timetableResult.success && timetableResult.preview && timetableResult.preview.length > 0) {
      const ttUpload = await replaceFacultyTimetable(
        user!.id,
        userName,
        userEmail,
        timetableResult.preview as any, // The preview has sufficient data for the service
      );
      timetableUpdated = ttUpload.entriesCreated;
    }

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
      timetableUpdated: timetableUpdated,
      coursesUpdated: uploadResult.coursesUpdated,
      warnings: [...parseResult.warnings, ...uploadResult.warnings, ...(timetableResult.warnings || [])],
      message: timetableUpdated > 0 
        ? `Successfully updated availability for ${uploadResult.daysUpdated} days AND your timetable with ${timetableUpdated} classes.`
        : `Successfully updated availability for ${uploadResult.daysUpdated} days.`,
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
