import { NextRequest } from "next/server";
import { getDepartments, getDepartmentOptions } from "@/lib/api/departments";
import { successResponse, internalErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const options = searchParams.get("options") === "true";

  try {
    if (options) {
      const result = await getDepartmentOptions();
      if (!result.success) {
        return internalErrorResponse(
          result.error || "Failed to fetch department options",
        );
      }
      return successResponse(result.data);
    }

    const result = await getDepartments();
    if (!result.success) {
      return internalErrorResponse(
        result.error || "Failed to fetch departments",
      );
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return internalErrorResponse("Failed to fetch departments");
  }
}
