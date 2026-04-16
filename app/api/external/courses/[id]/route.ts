import { getCourseById } from "@/lib/api/courses";
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
  const courseId = parseInt(id, 10);

  if (isNaN(courseId)) {
    return notFoundResponse("Course");
  }

  try {
    const result = await getCourseById(courseId);
    if (!result.success) {
      return notFoundResponse("Course");
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching course:", error);
    return internalErrorResponse("Failed to fetch course");
  }
}
