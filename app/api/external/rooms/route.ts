import { NextRequest } from "next/server";
import { getRooms, getRoomOptions } from "@/lib/api/rooms";
import {
  successResponse,
  internalErrorResponse,
  badRequestResponse,
} from "@/lib/api-response";
import type { RoomStatus } from "@/lib/types/external";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const options = searchParams.get("options") === "true";

  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") as RoomStatus | null;
  const campusId = searchParams.get("campusId") || undefined;
  const buildingId = searchParams.get("buildingId") || undefined;
  const tagId = searchParams.get("tagId") || undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!, 10)
    : undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : undefined;

  try {
    if (options) {
      const result = await getRoomOptions({
        q,
        status: status || undefined,
        campusId,
        buildingId,
        tagId,
        page,
        limit,
      });
      if (!result.success) {
        return internalErrorResponse(
          result.error || "Failed to fetch room options",
        );
      }
      return successResponse(result.data);
    }

    const result = await getRooms({
      q,
      status: status || undefined,
      campusId,
      buildingId,
      tagId,
      page,
      limit,
    });
    if (!result.success) {
      return internalErrorResponse(result.error || "Failed to fetch rooms");
    }
    return successResponse(result.data);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return internalErrorResponse("Failed to fetch rooms");
  }
}
