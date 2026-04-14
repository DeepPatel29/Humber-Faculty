"use client";

import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr";
import useSWRMutation from "swr/mutation";
import {
  getDashboardData,
  getProfile,
  updateProfile,
  getTeachingHistory,
  createTeachingHistory,
  updateTeachingHistory,
  deleteTeachingHistory,
  getTimetable,
  getTodaySchedule,
  getUpcomingSchedule,
  getAvailability,
  updateAvailability,
  getRequests,
  createSwapRequest,
  createRescheduleRequest,
  createLeaveRequest,
  withdrawRequest,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getClassOptions,
  getColleagueOptions,
  getDepartmentOptions,
  listFacultyResources,
  getFacultyResource,
  createFacultyResource,
  updateFacultyResource,
  deleteFacultyResource,
  type TimetableParams,
  type RequestsParams,
  type NotificationsParams,
} from "@/lib/api/faculty-client";
import type {
  UpdateProfileInput,
  CreateTeachingHistoryInput,
  UpdateTeachingHistoryInput,
  UpdateAvailabilityInput,
  CreateSwapRequestInput,
  CreateRescheduleRequestInput,
  CreateLeaveRequestInput,
  CreateFacultyResourceInput,
  UpdateFacultyResourceInput,
} from "@/lib/validations/faculty";

// ============================================================================
// SWR Configuration
// ============================================================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
};

// ============================================================================
// Dashboard Hook
// ============================================================================

export function useDashboard(config?: SWRConfiguration) {
  return useSWR(
    "faculty-dashboard",
    async () => {
      const res = await getDashboardData();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch dashboard data");
      }
      return res.data;
    },
    { ...defaultConfig, refreshInterval: 60000, ...config }
  );
}

// ============================================================================
// Profile Hooks
// ============================================================================

export function useProfile(config?: SWRConfiguration) {
  return useSWR(
    "faculty-profile",
    async () => {
      const res = await getProfile();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch profile");
      }
      return res.data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useUpdateProfile() {
	return useSWRMutation(
		"faculty-profile",
		async (_key: string, { arg }: { arg: UpdateProfileInput }) => {
			const res = await updateProfile(arg);
			if (!res.success) {
				throw new Error(res.error || "Failed to update profile");
			}
			await globalMutate("faculty-profile");
			await globalMutate("faculty-dashboard");
			return res.data;
		}
	);
}

export function useTeachingHistory(config?: SWRConfiguration) {
  return useSWR(
    "faculty-teaching-history",
    async () => {
      const res = await getTeachingHistory();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch teaching history");
      }
      return Array.isArray(res.data.teachingHistory) ? res.data.teachingHistory : [];
    },
    { ...defaultConfig, ...config }
  );
}

export function useCreateTeachingHistory() {
  return useSWRMutation(
    "faculty-teaching-history",
    async (_key: string, { arg }: { arg: CreateTeachingHistoryInput }) => {
      const res = await createTeachingHistory(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to create teaching history");
      }
      await globalMutate("faculty-teaching-history");
      return res.data;
    }
  );
}

export function useUpdateTeachingHistory() {
  return useSWRMutation(
    "faculty-teaching-history",
    async (
      _key: string,
      { arg }: { arg: { id: string; data: UpdateTeachingHistoryInput } }
    ) => {
      const res = await updateTeachingHistory(arg.id, arg.data);
      if (!res.success) {
        throw new Error(res.error || "Failed to update teaching history");
      }
      await globalMutate("faculty-teaching-history");
      return res.data;
    }
  );
}

export function useDeleteTeachingHistory() {
  return useSWRMutation(
    "faculty-teaching-history",
    async (_key: string, { arg }: { arg: string }) => {
      const res = await deleteTeachingHistory(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete teaching history");
      }
      await globalMutate("faculty-teaching-history");
      return res.data;
    }
  );
}

// ============================================================================
// Timetable Hooks
// ============================================================================

export function useTimetable(params?: TimetableParams, config?: SWRConfiguration) {
  const key = params
    ? ["faculty-timetable", params.weekStart, params.weekEnd, params.courseCode, params.program]
    : "faculty-timetable";

  return useSWR(
    key,
    async () => {
      const res = await getTimetable(params);
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch timetable");
      }
      // Safely normalize data to always be an array
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useTodaySchedule(config?: SWRConfiguration) {
  return useSWR(
    "faculty-today-schedule",
    async () => {
      const res = await getTodaySchedule();
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch today's schedule");
      }
      // Safely normalize data to always be an array
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useUpcomingSchedule(limit = 5, config?: SWRConfiguration) {
  return useSWR(
    ["faculty-upcoming-schedule", limit],
    async () => {
      const res = await getUpcomingSchedule(limit);
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch upcoming schedule");
      }
      // Safely normalize data to always be an array
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

// ============================================================================
// Availability Hooks
// ============================================================================

export function useAvailability(config?: SWRConfiguration) {
  return useSWR(
    "faculty-availability",
    async () => {
      const res = await getAvailability();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch availability");
      }
      return res.data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useUpdateAvailability() {
	return useSWRMutation(
		"faculty-availability",
		async (_key: string, { arg }: { arg: UpdateAvailabilityInput }) => {
			const res = await updateAvailability(arg);
			if (!res.success) {
				throw new Error(res.error || "Failed to update availability");
			}
			await globalMutate("faculty-availability");
			await globalMutate("faculty-dashboard");
			await globalMutate("faculty-timetable");
			return res.data;
		}
	);
}

// ============================================================================
// Requests Hooks
// ============================================================================

export function useRequests(params?: RequestsParams, config?: SWRConfiguration) {
  const key = params
    ? ["faculty-requests", params.status, params.type, params.page, params.pageSize]
    : "faculty-requests";

  return useSWR(
    key,
    async () => {
      const res = await getRequests(params);
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch requests");
      }
      const data = Array.isArray(res.data) ? res.data : [];
      return { data, meta: res.meta };
    },
    { ...defaultConfig, ...config }
  );
}

export function useCreateSwapRequest() {
  return useSWRMutation(
    "faculty-requests",
    async (_key: string, { arg }: { arg: CreateSwapRequestInput }) => {
      const res = await createSwapRequest(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to create swap request");
      }
      return res.data;
    }
  );
}

export function useCreateRescheduleRequest() {
  return useSWRMutation(
    "faculty-requests",
    async (_key: string, { arg }: { arg: CreateRescheduleRequestInput }) => {
      const res = await createRescheduleRequest(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to create reschedule request");
      }
      return res.data;
    }
  );
}

export function useCreateLeaveRequest() {
  return useSWRMutation(
    "faculty-requests",
    async (_key: string, { arg }: { arg: CreateLeaveRequestInput }) => {
      const res = await createLeaveRequest(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to create leave request");
      }
      return res.data;
    }
  );
}

export function useWithdrawRequest() {
  return useSWRMutation(
    "faculty-requests",
    async (_key: string, { arg }: { arg: string }) => {
      const res = await withdrawRequest(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to withdraw request");
      }
      return res.data;
    }
  );
}

// ============================================================================
// Notifications Hooks
// ============================================================================

export function useNotifications(params?: NotificationsParams, config?: SWRConfiguration) {
  const key = params
    ? ["faculty-notifications", params.unreadOnly, params.page, params.pageSize]
    : "faculty-notifications";

  return useSWR(
    key,
    async () => {
      const res = await getNotifications(params);
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch notifications");
      }
      const data = Array.isArray(res.data) ? res.data : [];
      return { data, meta: res.meta };
    },
    { ...defaultConfig, ...config }
  );
}

export function useUnreadCount(config?: SWRConfiguration) {
  return useSWR(
    "faculty-unread-count",
    async () => {
      const res = await getUnreadCount();
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch unread count");
      }
      return res.data.count;
    },
    { ...defaultConfig, refreshInterval: 30000, ...config }
  );
}

export function useMarkNotificationAsRead() {
  return useSWRMutation(
    "faculty-notifications",
    async (_key: string, { arg }: { arg: string }) => {
      const res = await markNotificationAsRead(arg);
      if (!res.success) {
        throw new Error(res.error || "Failed to mark notification as read");
      }
      return res.data;
    }
  );
}

export function useMarkAllNotificationsAsRead() {
  return useSWRMutation(
    "faculty-notifications",
    async () => {
      const res = await markAllNotificationsAsRead();
      if (!res.success) {
        throw new Error(res.error || "Failed to mark all notifications as read");
      }
      return res.data;
    }
  );
}

// ============================================================================
// Options Hooks
// ============================================================================

export function useClassOptions(config?: SWRConfiguration) {
  return useSWR(
    "faculty-class-options",
    async () => {
      const res = await getClassOptions();
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch class options");
      }
      // Safely normalize data to always be an array
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useColleagueOptions(config?: SWRConfiguration) {
  return useSWR(
    "faculty-colleague-options",
    async () => {
      const res = await getColleagueOptions();
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch colleague options");
      }
      // Safely normalize data to always be an array
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useDepartmentOptions(config?: SWRConfiguration) {
  return useSWR(
    "faculty-department-options",
    async () => {
      const res = await getDepartmentOptions();
      if (!res.success) {
        throw new Error(res.error || "Failed to fetch department options");
      }
      const data = Array.isArray(res.data) ? res.data : [];
      return data;
    },
    { ...defaultConfig, ...config }
  );
}

// ============================================================================
// Admin: canonical Faculty CRUD (GET /api/faculty, /api/faculty/[id])
// ============================================================================

export function useFacultyAdminList(page: number, limit = 20, config?: SWRConfiguration) {
  return useSWR(
    ["faculty-admin-list", page, limit],
    async () => {
      const res = await listFacultyResources({ page, limit });
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to list faculty");
      }
      return res.data;
    },
    { ...defaultConfig, ...config }
  );
}

export function useFacultyAdminDetail(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? ["faculty-admin-detail", id] : null,
    async () => {
      const res = await getFacultyResource(id!);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to load faculty");
      }
      return res.data.faculty;
    },
    { ...defaultConfig, ...config }
  );
}

export function useCreateFacultyResource() {
  return useSWRMutation(
    "faculty-admin-create",
    async (_key: string, { arg }: { arg: CreateFacultyResourceInput }) => {
      const res = await createFacultyResource(arg);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to create faculty");
      }
      await globalMutate((k) => Array.isArray(k) && k[0] === "faculty-admin-list");
      return res.data;
    }
  );
}

export function useUpdateFacultyResource() {
  return useSWRMutation(
    "faculty-admin-update",
    async (
      _key: string,
      { arg }: { arg: { id: string; data: UpdateFacultyResourceInput } }
    ) => {
      const res = await updateFacultyResource(arg.id, arg.data);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to update faculty");
      }
      await globalMutate((k) => Array.isArray(k) && k[0] === "faculty-admin-list");
      await globalMutate(["faculty-admin-detail", arg.id]);
      return res.data;
    }
  );
}

export function useDeleteFacultyResource() {
  return useSWRMutation(
    "faculty-admin-delete",
    async (_key: string, { arg }: { arg: string }) => {
      const res = await deleteFacultyResource(arg);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to delete faculty");
      }
      await globalMutate((k) => Array.isArray(k) && k[0] === "faculty-admin-list");
      return res.data;
    }
  );
}
