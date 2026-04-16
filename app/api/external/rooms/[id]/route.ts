import { getRoomById } from "@/lib/api/rooms";
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

  if (!id) {
    return notFoundResponse("Room");
  }

  try {
    const result = await getRoomById(id);
    if (!result.success) {
      return notFoundResponse("Room");
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching room:", error);
    return internalErrorResponse("Failed to fetch room");
  }
}
