import { NextRequest } from "next/server";
import { getCourses, getCourseOptions } from "@/lib/api/courses";
import {
  successResponse,
  internalErrorResponse,
  badRequestResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const options = searchParams.get("options") === "true";
  const status = searchParams.get("status") as
    | "ACTIVE"
    | "INACTIVE"
    | "ARCHIVED"
    | null;

  try {
    if (options) {
      const result = await getCourseOptions();
      if (!result.success) {
        return internalErrorResponse(
          result.error || "Failed to fetch course options",
        );
      }
      return successResponse(result.data);
    }

    const result = await getCourses(status ? { status } : undefined);
    if (!result.success) {
      return internalErrorResponse(result.error || "Failed to fetch courses");
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return internalErrorResponse("Failed to fetch courses");
  }
}
