import type {
  FacultyDashboardData,
  FacultyProfile,
  FacultyTeachingHistoryEntry,
  FacultyScheduleItem,
  FacultyRequest,
  FacultyRequestDetail,
  FacultyNotification,
  FacultyAvailability,
  ClassOption,
  ColleagueOption,
  Faculty,
} from "@/lib/types/faculty";
import type {
  CourseOption,
  RoomOption,
  ExternalRoomAvailability,
  ExternalRoomTimetable,
} from "@/lib/types/external";
import type { DepartmentOption as ExternalDepartmentOption } from "@/lib/types/external";
import type {
  UpdateProfileInput,
  UpdateAvailabilityInput,
  CreateSwapRequestInput,
  CreateRescheduleRequestInput,
  CreateLeaveRequestInput,
  CreateFacultyResourceInput,
  CreateTeachingHistoryInput,
  UpdateFacultyResourceInput,
  UpdateTeachingHistoryInput,
} from "@/lib/validations/faculty";

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unreadCount?: number;
  };
  error?: string;
}

// ============================================================================
// Fetch Wrapper
// ============================================================================

async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      const details = json?.error?.details as
        | Record<string, string[]>
        | undefined;
      const detailMessage = details
        ? Object.entries(details)
            .flatMap(([field, messages]) =>
              messages.map((msg) =>
                field === "_root" ? msg : `${field}: ${msg}`,
              ),
            )
            .join(" | ")
        : "";
      const errMsg =
        typeof json.error === "string"
          ? json.error
          : detailMessage ||
            json.error?.message ||
            `Request failed with status ${res.status}`;
      return {
        success: false,
        error: errMsg,
      };
    }

    return json;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============================================================================
// Dashboard API
// ============================================================================

export async function getDashboardData(): Promise<
  ApiResponse<FacultyDashboardData>
> {
  return fetchApi<FacultyDashboardData>("/api/faculty/dashboard");
}

// ============================================================================
// Profile API
// ============================================================================

export async function getProfile(): Promise<
  ApiResponse<{ faculty: Faculty; profile: FacultyProfile }>
> {
  return fetchApi("/api/faculty/profile");
}

export async function updateProfile(
  data: UpdateProfileInput,
): Promise<ApiResponse<{ faculty: Faculty; profile: FacultyProfile }>> {
  return fetchApi<{ faculty: Faculty; profile: FacultyProfile }>(
    "/api/faculty/profile",
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export async function getTeachingHistory(): Promise<
  ApiResponse<{ teachingHistory: FacultyTeachingHistoryEntry[] }>
> {
  return fetchApi<{ teachingHistory: FacultyTeachingHistoryEntry[] }>(
    "/api/faculty/teaching-history",
  );
}

export async function createTeachingHistory(
  data: CreateTeachingHistoryInput,
): Promise<ApiResponse<{ teachingHistory: FacultyTeachingHistoryEntry }>> {
  return fetchApi<{ teachingHistory: FacultyTeachingHistoryEntry }>(
    "/api/faculty/teaching-history",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function updateTeachingHistory(
  id: string,
  data: UpdateTeachingHistoryInput,
): Promise<ApiResponse<{ teachingHistory: FacultyTeachingHistoryEntry }>> {
  return fetchApi<{ teachingHistory: FacultyTeachingHistoryEntry }>(
    `/api/faculty/teaching-history/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteTeachingHistory(
  id: string,
): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
  return fetchApi<{ deleted: boolean; id: string }>(
    `/api/faculty/teaching-history/${id}`,
    {
      method: "DELETE",
    },
  );
}

// ============================================================================
// Timetable API
// ============================================================================

export interface TimetableParams {
  weekStart?: string;
  weekEnd?: string;
  courseCode?: string;
  program?: string;
}

interface TimetableApiResponse {
  items: FacultyScheduleItem[];
  weekStart: string;
  weekEnd: string;
}

export async function getTimetable(
  params?: TimetableParams,
): Promise<ApiResponse<FacultyScheduleItem[]>> {
  const searchParams = new URLSearchParams();
  if (params?.weekStart) searchParams.set("weekStart", params.weekStart);
  if (params?.weekEnd) searchParams.set("weekEnd", params.weekEnd);
  if (params?.courseCode) searchParams.set("courseCode", params.courseCode);
  if (params?.program) searchParams.set("program", params.program);

  const query = searchParams.toString();
  const res = await fetchApi<TimetableApiResponse>(
    `/api/faculty/timetable${query ? `?${query}` : ""}`,
  );

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch timetable" };
  }

  // Normalize response - API returns { items: [...] } but we want to return the array directly
  const items = Array.isArray(res.data.items)
    ? res.data.items
    : Array.isArray(res.data)
      ? res.data
      : [];

  return { success: true, data: items };
}

interface TodayScheduleApiResponse {
  items: FacultyScheduleItem[];
  date: string;
}

export async function getTodaySchedule(): Promise<
  ApiResponse<FacultyScheduleItem[]>
> {
  const res = await fetchApi<TodayScheduleApiResponse>(
    "/api/faculty/timetable/today",
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch today's schedule",
    };
  }

  const items = Array.isArray(res.data.items)
    ? res.data.items
    : Array.isArray(res.data)
      ? res.data
      : [];

  return { success: true, data: items };
}

interface UpcomingScheduleApiResponse {
  items: FacultyScheduleItem[];
}

export async function getUpcomingSchedule(
  limit = 5,
): Promise<ApiResponse<FacultyScheduleItem[]>> {
  const res = await fetchApi<UpcomingScheduleApiResponse>(
    `/api/faculty/timetable/upcoming?limit=${limit}`,
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch upcoming schedule",
    };
  }

  const items = Array.isArray(res.data.items)
    ? res.data.items
    : Array.isArray(res.data)
      ? res.data
      : [];

  return { success: true, data: items };
}

// ============================================================================
// Availability API
// ============================================================================

export async function getAvailability(): Promise<
  ApiResponse<FacultyAvailability>
> {
  return fetchApi<FacultyAvailability>("/api/faculty/availability");
}

export async function updateAvailability(
  data: UpdateAvailabilityInput,
): Promise<ApiResponse<FacultyAvailability>> {
  return fetchApi<FacultyAvailability>("/api/faculty/availability", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Requests API
// ============================================================================

export interface RequestsParams {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

interface RequestsApiResponse {
  requests: FacultyRequest[];
  total: number;
}

export async function getRequests(
  params?: RequestsParams,
): Promise<PaginatedResponse<FacultyRequest>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("limit", String(params.pageSize));

  const query = searchParams.toString();
  const res = await fetchApi<RequestsApiResponse>(
    `/api/faculty/requests${query ? `?${query}` : ""}`,
  );

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch requests" };
  }

  const { requests, total } = res.data;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  return {
    success: true,
    data: Array.isArray(requests) ? requests : [],
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getRequestById(
  id: string,
): Promise<ApiResponse<FacultyRequestDetail>> {
  return fetchApi<FacultyRequestDetail>(`/api/faculty/requests/${id}`);
}

export async function createSwapRequest(
  data: CreateSwapRequestInput,
): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/swap", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createRescheduleRequest(
  data: CreateRescheduleRequestInput,
): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/reschedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createLeaveRequest(
  data: CreateLeaveRequestInput,
): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/leave", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function withdrawRequest(
  id: string,
): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>(`/api/faculty/requests/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "WITHDRAWN" }),
  });
}

// ============================================================================
// Notifications API
// ============================================================================

export interface NotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

interface NotificationsApiResponse {
  notifications: FacultyNotification[];
  total: number;
  unreadCount: number;
}

export async function getNotifications(
  params?: NotificationsParams,
): Promise<PaginatedResponse<FacultyNotification>> {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("limit", String(params.pageSize));

  const query = searchParams.toString();
  const res = await fetchApi<NotificationsApiResponse>(
    `/api/faculty/notifications${query ? `?${query}` : ""}`,
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch notifications",
    };
  }

  const { notifications, total, unreadCount } = res.data;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  return {
    success: true,
    data: Array.isArray(notifications) ? notifications : [],
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    },
  };
}

export async function getUnreadCount(): Promise<
  ApiResponse<{ count: number }>
> {
  return fetchApi<{ count: number }>("/api/faculty/notifications/unread-count");
}

export async function markNotificationAsRead(
  id: string,
): Promise<ApiResponse<FacultyNotification>> {
  return fetchApi<FacultyNotification>(
    `/api/faculty/notifications/${id}/read`,
    {
      method: "PUT",
    },
  );
}

export async function markAllNotificationsAsRead(): Promise<
  ApiResponse<{ count: number }>
> {
  return fetchApi<{ count: number }>("/api/faculty/notifications/read-all", {
    method: "PUT",
  });
}

// ============================================================================
// Options API (for forms)
// ============================================================================

interface ClassOptionsApiResponse {
  classes: ClassOption[];
}

export async function getClassOptions(): Promise<ApiResponse<ClassOption[]>> {
  const res = await fetchApi<ClassOptionsApiResponse>(
    "/api/faculty/classes/options",
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch class options",
    };
  }

  const classes = Array.isArray(res.data.classes)
    ? res.data.classes
    : Array.isArray(res.data)
      ? res.data
      : [];

  return { success: true, data: classes };
}

interface ColleagueOptionsApiResponse {
  colleagues: ColleagueOption[];
}

export async function getColleagueOptions(): Promise<
  ApiResponse<ColleagueOption[]>
> {
  const res = await fetchApi<ColleagueOptionsApiResponse>(
    "/api/faculty/colleagues/options",
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch colleague options",
    };
  }

  const colleagues = Array.isArray(res.data.colleagues)
    ? res.data.colleagues
    : Array.isArray(res.data)
      ? res.data
      : [];

  return { success: true, data: colleagues };
}

interface FacultyDepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface DepartmentOptionsApiResponse {
  departments: FacultyDepartmentOption[];
}

export async function getDepartmentOptions(): Promise<
  ApiResponse<FacultyDepartmentOption[]>
> {
  const res = await fetchApi<DepartmentOptionsApiResponse>(
    "/api/faculty/departments/options",
  );

  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || "Failed to fetch department options",
    };
  }

  const departments = Array.isArray(res.data.departments)
    ? res.data.departments
    : Array.isArray(res.data)
      ? (res.data as FacultyDepartmentOption[])
      : [];

  return { success: true, data: departments };
}

// ============================================================================
// Canonical Faculty CRUD (admin / directory)
// ============================================================================

export interface FacultyDirectoryRow {
  id: string;
  userId: string;
  departmentId: string;
  employeeId: string;
  designation: string;
  status: string;
  joiningDate: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
  };
}

export interface FacultyListPayload {
  faculty: FacultyDirectoryRow[];
  total: number;
  page: number;
  limit: number;
}

export interface PreferredSubjectRow {
  id: string;
  subjectName: string;
  createdAt: string;
}

export interface FacultyDetailPayload {
  id: string;
  userId: string;
  departmentId: string;
  employeeId: string;
  designation: string;
  status: string;
  joiningDate: string;
  preferredSubjects: PreferredSubjectRow[];
  user: FacultyDirectoryRow["user"];
  department: FacultyDirectoryRow["department"];
  profile: FacultyProfile | null;
}

export async function listFacultyResources(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<FacultyListPayload>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return fetchApi<FacultyListPayload>(`/api/faculty?${qs.toString()}`);
}

export async function getFacultyResource(
  id: string,
): Promise<ApiResponse<{ faculty: FacultyDetailPayload }>> {
  return fetchApi<{ faculty: FacultyDetailPayload }>(`/api/faculty/${id}`);
}

export async function createFacultyResource(
  data: CreateFacultyResourceInput,
): Promise<ApiResponse<{ faculty: FacultyDetailPayload }>> {
  return fetchApi<{ faculty: FacultyDetailPayload }>("/api/faculty", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFacultyResource(
  id: string,
  data: UpdateFacultyResourceInput,
): Promise<ApiResponse<{ faculty: FacultyDetailPayload }>> {
  return fetchApi<{ faculty: FacultyDetailPayload }>(`/api/faculty/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFacultyResource(
  id: string,
): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
  return fetchApi<{ deleted: boolean; id: string }>(`/api/faculty/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// External Data API (Courses, Departments, Rooms from external services)
// ============================================================================

export async function getExternalCourseOptions(): Promise<
  ApiResponse<CourseOption[]>
> {
  return fetchApi<CourseOption[]>("/api/external/courses?options=true");
}

export async function getExternalCourses(params?: {
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}): Promise<ApiResponse<CourseOption[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return fetchApi<CourseOption[]>(
    `/api/external/courses${query ? `?${query}` : ""}`,
  );
}

export async function getExternalCourseById(
  id: string,
): Promise<ApiResponse<CourseOption>> {
  return fetchApi<CourseOption>(`/api/external/courses/${id}`);
}

export async function getExternalDepartmentOptions(): Promise<
  ApiResponse<ExternalDepartmentOption[]>
> {
  return fetchApi<ExternalDepartmentOption[]>(
    "/api/external/departments?options=true",
  );
}

export async function getExternalDepartments(): Promise<
  ApiResponse<ExternalDepartmentOption[]>
> {
  return fetchApi<ExternalDepartmentOption[]>("/api/external/departments");
}

export async function getExternalDepartmentById(
  id: string,
): Promise<ApiResponse<ExternalDepartmentOption>> {
  return fetchApi<ExternalDepartmentOption>(`/api/external/departments/${id}`);
}

export async function getExternalRoomOptions(params?: {
  q?: string;
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  campusId?: string;
  buildingId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<RoomOption[]>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.campusId) searchParams.set("campusId", params.campusId);
  if (params?.buildingId) searchParams.set("buildingId", params.buildingId);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  searchParams.set("options", "true");

  const query = searchParams.toString();
  return fetchApi<RoomOption[]>(`/api/external/rooms?${query}`);
}

export async function getExternalRooms(params?: {
  q?: string;
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  campusId?: string;
  buildingId?: string;
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<{
    data: RoomOption[];
    total: number;
    page: number;
    limit: number;
  }>
> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.campusId) searchParams.set("campusId", params.campusId);
  if (params?.buildingId) searchParams.set("buildingId", params.buildingId);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return fetchApi<{
    data: RoomOption[];
    total: number;
    page: number;
    limit: number;
  }>(`/api/external/rooms?${query}`);
}

export async function getExternalRoomById(
  id: string,
): Promise<ApiResponse<RoomOption>> {
  return fetchApi<RoomOption>(`/api/external/rooms/${id}`);
}

export async function getExternalRoomAvailability(
  id: string,
): Promise<ApiResponse<ExternalRoomAvailability>> {
  return fetchApi<ExternalRoomAvailability>(
    `/api/external/rooms/${id}/availability`,
  );
}

export async function getExternalRoomTimetable(
  id: string,
): Promise<ApiResponse<ExternalRoomTimetable>> {
  return fetchApi<ExternalRoomTimetable>(`/api/external/rooms/${id}/timetable`);
}
