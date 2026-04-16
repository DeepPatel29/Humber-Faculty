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
import { parseTimetableFile, validateFile } from "@/lib/timetable-parser";
import {
  replaceFacultyTimetable,
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
    const parseResult = await parseTimetableFile(buffer, file.name);

    if (!parseResult.success) {
      return successResponse({
        ...parseResult,
        message: "Failed to parse timetable file",
      });
    }

    if (!confirm) {
      return successResponse({
        ...parseResult,
        message: "File parsed successfully. Confirm to apply changes.",
        requiresConfirmation: true,
      });
    }

    if (!parseResult.preview || parseResult.preview.length === 0) {
      return badRequestResponse("No valid entries to import");
    }

    const userName = user?.name || "";
    const userEmail = user?.email || "";

    const uploadResult = await replaceFacultyTimetable(
      user!.id,
      userName,
      userEmail,
      parseResult.preview,
    );

    await notifyAdminsOfUpload(
      user!.id,
      user!.name || "Faculty",
      uploadResult.entriesCreated,
      file.name,
    );

    return successResponse({
      success: true,
      filename: file.name,
      fileType: parseResult.fileType,
      entriesParsed: parseResult.entriesParsed,
      entriesCreated: uploadResult.entriesCreated,
      entriesDeleted: uploadResult.entriesDeleted,
      warnings: [...parseResult.warnings, ...uploadResult.warnings],
      message: `Successfully imported ${uploadResult.entriesCreated} timetable entries`,
    });
  } catch (error) {
    console.error("Timetable upload error:", error);
    return internalErrorResponse(
      error instanceof Error
        ? error.message
        : "Failed to process timetable upload",
    );
  }
}
