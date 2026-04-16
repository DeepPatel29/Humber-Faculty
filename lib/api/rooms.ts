import { fetchFacilitiesApi } from "./external-client";
import type {
  ExternalRoom,
  ExternalRoomWithDetails,
  ExternalRoomsResponse,
  ExternalRoomAvailability,
  ExternalRoomTimetable,
  RoomOption,
  RoomStatus,
  RoomType,
} from "@/lib/types/external";

export interface RoomsListParams {
  q?: string;
  status?: RoomStatus;
  campusId?: string;
  buildingId?: string;
  tagId?: string;
  page?: number;
  limit?: number;
}

export async function getRooms(
  params?: RoomsListParams,
): Promise<{ success: boolean; data?: ExternalRoomsResponse; error?: string }> {
  const queryParams = new URLSearchParams();

  if (params?.q) queryParams.set("q", params.q);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.campusId) queryParams.set("campusId", params.campusId);
  if (params?.buildingId) queryParams.set("buildingId", params.buildingId);
  if (params?.tagId) queryParams.set("tagId", params.tagId);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  const query = queryParams.toString();
  const endpoint = `/api/rooms${query ? `?${query}` : ""}`;

  const response = await fetchFacilitiesApi<ExternalRoomsResponse>(endpoint);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

export async function getRoomById(
  id: string,
): Promise<{
  success: boolean;
  data?: ExternalRoomWithDetails;
  error?: string;
}> {
  const response = await fetchFacilitiesApi<{ data: ExternalRoomWithDetails }>(
    `/api/rooms/${id}`,
  );

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data?.data };
}

export async function getRoomAvailability(
  id: string,
): Promise<{
  success: boolean;
  data?: ExternalRoomAvailability;
  error?: string;
}> {
  const response = await fetchFacilitiesApi<{ data: ExternalRoomAvailability }>(
    `/api/rooms/${id}/availability`,
  );

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data?.data };
}

export async function getRoomTimetable(
  id: string,
): Promise<{ success: boolean; data?: ExternalRoomTimetable; error?: string }> {
  const response = await fetchFacilitiesApi<{ data: ExternalRoomTimetable }>(
    `/api/rooms/${id}/timetable`,
  );

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data?.data };
}

export async function getAvailableRooms(
  campusId?: string,
): Promise<{ success: boolean; data?: ExternalRoom[]; error?: string }> {
  const params: RoomsListParams = { status: "AVAILABLE" };
  if (campusId) params.campusId = campusId;

  const response = await getRooms(params);

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data.data };
}

export async function getRoomOptions(
  params?: RoomsListParams,
): Promise<{ success: boolean; data?: RoomOption[]; error?: string }> {
  const response = await getRooms(params);

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  const options: RoomOption[] = response.data.data.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    building: room.building?.name || "",
    buildingCode: room.building?.buildingCode || "",
    campus: room.building?.campus?.name || "",
    capacity: room.capacity,
    roomType: room.roomType,
    currentStatus: room.currentStatus,
    label: `${room.building?.buildingCode || ""}-${room.roomNumber} (${room.capacity})`,
  }));

  return { success: true, data: options };
}

export async function getBuildings(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    buildingCode: string;
    campusId: string;
  }>;
  error?: string;
}> {
  const response = await fetchFacilitiesApi<{
    data: Array<{
      id: string;
      name: string;
      buildingCode: string;
      campusId: string;
    }>;
  }>("/api/buildings");

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data?.data };
}

export async function getCampuses(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    address: string;
    timezone: string;
  }>;
  error?: string;
}> {
  const response = await fetchFacilitiesApi<{
    data: Array<{
      id: string;
      name: string;
      address: string;
      timezone: string;
    }>;
  }>("/api/campuses");

  if (!response.success) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data?.data };
}

export async function searchRooms(
  query: string,
): Promise<{
  success: boolean;
  data?: ExternalRoomWithDetails[];
  error?: string;
}> {
  const response = await getRooms({ q: query, limit: 20 });

  if (!response.success || !response.data) {
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data.data };
}
