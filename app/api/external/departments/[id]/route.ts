import { getDepartmentById } from "@/lib/api/departments";
import {
  successResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const departmentId = parseInt(id, 10);

  if (isNaN(departmentId)) {
    return notFoundResponse("Department");
  }

  try {
    const result = await getDepartmentById(departmentId);
    if (!result.success) {
      return notFoundResponse("Department");
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching department:", error);
    return internalErrorResponse("Failed to fetch department");
  }
}
