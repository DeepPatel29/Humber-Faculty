# FacultyHub - Source Code Reference

> **Project:** FacultyHub - Faculty Management Portal
> **Framework:** Next.js 16 with React 19, TypeScript, Tailwind CSS 4
> **Database:** PostgreSQL (Neon) with Prisma ORM
> **UI:** shadcn/ui with Radix UI primitives
> **Auth:** Better Auth with Prisma adapter
> **Last Updated:** March 2026 (Session 2)

## Implementation Status

- ✅ All API routes use Prisma + PostgreSQL (no more mock data)
- ✅ Per-user data isolation (each user sees their own data)
- ✅ Auto-creation of faculty records on first visit
- ✅ SWR hooks with global revalidation
- ✅ Course eligibility in availability form

---

## Table of Contents

1. [API Routes](#1-api-routes)
   - [Notifications Read-All](#notifications-read-all)
   - [Notification Mark as Read](#notification-mark-as-read)
2. [Client API Layer](#2-client-api-layer)
3. [Timetable Page](#3-timetable-page)
4. [Availability Page](#4-availability-page)
5. [Requests Page](#5-requests-page)
6. [Profile Page](#6-profile-page)
7. [RBAC System](#7-rbac-system)
   - [Roles and Permissions](#roles-and-permissions)
   - [Role Auth Hook](#role-auth-hook)
   - [Role Gate Component](#role-gate-component)
   - [Auth Helpers](#auth-helpers)

---

## 7. RBAC System

### Roles and Permissions

**File:** `lib/types/roles.ts`

```typescript
export const ROLES = {
  FACULTY: "FACULTY",
  ADMIN: "ADMIN",
  SCHEDULER: "SCHEDULER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  "profile:read:own": ["FACULTY", "ADMIN", "SCHEDULER"],
  "profile:read:any": ["ADMIN", "SCHEDULER"],
  "profile:edit:own": ["FACULTY", "ADMIN"],
  "profile:edit:any": ["ADMIN"],

  "availability:read:own": ["FACULTY", "ADMIN", "SCHEDULER"],
  "availability:read:any": ["ADMIN", "SCHEDULER"],
  "availability:edit:own": ["FACULTY", "ADMIN"],
  "availability:edit:any": ["ADMIN"],

  "timetable:read:own": ["FACULTY", "ADMIN", "SCHEDULER"],
  "timetable:read:any": ["ADMIN", "SCHEDULER"],

  "requests:read:own": ["FACULTY", "ADMIN", "SCHEDULER"],
  "requests:read:any": ["ADMIN"],
  "requests:create": ["FACULTY"],
  "requests:withdraw:own": ["FACULTY"],
  "requests:approve": ["ADMIN"],
  "requests:reject": ["ADMIN"],

  "notifications:read:own": ["FACULTY", "ADMIN", "SCHEDULER"],

  "admin:access": ["ADMIN"],
  "admin:manage-faculty": ["ADMIN"],
  "admin:manage-departments": ["ADMIN"],

  "scheduler:read-constraints": ["SCHEDULER", "ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return (allowed as readonly string[]).includes(role);
}

export const ROLE_INFO: Record<UserRole, { label: string; color: string; description: string }> = {
  FACULTY: {
    label: "Faculty",
    color: "blue",
    description: "Can manage own profile, availability, and submit requests",
  },
  ADMIN: {
    label: "Department Admin",
    color: "purple",
    description: "Can manage all faculty data and approve requests",
  },
  SCHEDULER: {
    label: "Scheduler",
    color: "green",
    description: "Can view faculty constraints for scheduling (read-only)",
  },
};
```

### Access Rules

| Route | FACULTY | ADMIN | SCHEDULER |
|-------|---------|-------|-----------|
| `/faculty/dashboard` | View | View | View |
| `/faculty/timetable` | View own | View all | View all |
| `/faculty/profile` | Edit own | Edit any | Read only |
| `/faculty/availability` | Edit own | Edit any | Read only |
| `/faculty/requests` | Create/Withdraw own | Approve/Reject all | Read only |
| `/faculty/notifications` | Own notifications | Own notifications | Own notifications |
| `/admin/*` | ❌ Denied | ✅ Full access | ❌ Denied |

### Testing Roles

Login with these email patterns to test different roles:

- **FACULTY**: `john@university.edu` → Default role, can edit own data
- **ADMIN**: `admin@university.edu` → Contains "admin", full access
- **SCHEDULER**: `scheduler@university.edu` → Contains "scheduler", read-only

---

## 1. API Routes

### Database-Backed Architecture

All API routes now use Prisma ORM with PostgreSQL for persistent storage. Each route:

1. Validates session using `getSession()` from `lib/auth.ts`
2. Gets faculty context via `getFacultyContext()` from `lib/api/auth-helper.ts`
3. Returns only the authenticated user's data (per-user isolation)

### Notifications Read-All

**File:** `app/api/faculty/notifications/read-all/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFacultyContext } from "@/lib/api/auth-helper";

export async function PUT() {
  try {
    const ctx = await getFacultyContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.facultyNotification.updateMany({
      where: { facultyId: ctx.faculty.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: "All marked as read" },
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
```

### Notification Mark as Read

**File:** `app/api/faculty/notifications/[id]/read/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFacultyContext } from "@/lib/api/auth-helper";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getFacultyContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.facultyNotification.updateMany({
      where: { id, facultyId: ctx.faculty.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
```

---

## 2. Client API Layer

**File:** `lib/api/faculty-client.ts`

This client-side module provides typed fetch wrappers for all faculty API endpoints. It uses SWR hooks in `hooks/use-faculty.ts` for data fetching with automatic revalidation.

### Key Functions

| Function | Endpoint | Description |
|----------|----------|-------------|
| `getDashboardData()` | `GET /api/faculty/dashboard` | User-specific dashboard stats |
| `getProfile()` | `GET /api/faculty/profile` | User's profile data |
| `updateProfile(data)` | `PUT /api/faculty/profile` | Update profile |
| `getAvailability()` | `GET /api/faculty/availability` | User's availability preferences |
| `updateAvailability(data)` | `PUT /api/faculty/availability` | Update availability |
| `getTimetable(params)` | `GET /api/faculty/timetable` | User's schedule |
| `getTodaySchedule()` | `GET /api/faculty/timetable/today` | Today's classes |
| `getRequests(params)` | `GET /api/faculty/requests` | User's requests |
| `createSwapRequest(data)` | `POST /api/faculty/requests/swap` | Create swap request |
| `getNotifications(params)` | `GET /api/faculty/notifications` | User's notifications |
| `markNotificationAsRead(id)` | `PUT /api/faculty/notifications/[id]/read` | Mark as read |
| `markAllNotificationsAsRead()` | `PUT /api/faculty/notifications/read-all` | Mark all as read |

```typescript
import type {
  FacultyDashboardData,
  FacultyProfile,
  FacultyScheduleItem,
  FacultyRequest,
  FacultyNotification,
  FacultyAvailability,
  ClassOption,
  ColleagueOption,
  Faculty,
} from "@/lib/types/faculty";
import type {
  UpdateProfileInput,
  UpdateAvailabilityInput,
  CreateSwapRequestInput,
  CreateRescheduleRequestInput,
  CreateLeaveRequestInput,
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
  options?: RequestInit
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
      return {
        success: false,
        error: json.error || `Request failed with status ${res.status}`,
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

export async function getDashboardData(): Promise<ApiResponse<FacultyDashboardData>> {
  return fetchApi<FacultyDashboardData>("/api/faculty/dashboard");
}

// ============================================================================
// Profile API
// ============================================================================

export async function getProfile(): Promise<ApiResponse<{ faculty: Faculty; profile: FacultyProfile }>> {
  return fetchApi("/api/faculty/profile");
}

export async function updateProfile(data: UpdateProfileInput): Promise<ApiResponse<FacultyProfile>> {
  return fetchApi<FacultyProfile>("/api/faculty/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
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

export async function getTimetable(params?: TimetableParams): Promise<ApiResponse<FacultyScheduleItem[]>> {
  const searchParams = new URLSearchParams();
  if (params?.weekStart) searchParams.set("weekStart", params.weekStart);
  if (params?.weekEnd) searchParams.set("weekEnd", params.weekEnd);
  if (params?.courseCode) searchParams.set("courseCode", params.courseCode);
  if (params?.program) searchParams.set("program", params.program);

  const query = searchParams.toString();
  const res = await fetchApi<TimetableApiResponse>(`/api/faculty/timetable${query ? `?${query}` : ""}`);

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch timetable" };
  }

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

export async function getTodaySchedule(): Promise<ApiResponse<FacultyScheduleItem[]>> {
  const res = await fetchApi<TodayScheduleApiResponse>("/api/faculty/timetable/today");

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch today's schedule" };
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

export async function getUpcomingSchedule(limit = 5): Promise<ApiResponse<FacultyScheduleItem[]>> {
  const res = await fetchApi<UpcomingScheduleApiResponse>(`/api/faculty/timetable/upcoming?limit=${limit}`);

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch upcoming schedule" };
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

export async function getAvailability(): Promise<ApiResponse<FacultyAvailability>> {
  return fetchApi<FacultyAvailability>("/api/faculty/availability");
}

export async function updateAvailability(data: UpdateAvailabilityInput): Promise<ApiResponse<FacultyAvailability>> {
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

export async function getRequests(params?: RequestsParams): Promise<PaginatedResponse<FacultyRequest>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("limit", String(params.pageSize));

  const query = searchParams.toString();
  const res = await fetchApi<RequestsApiResponse>(`/api/faculty/requests${query ? `?${query}` : ""}`);

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

export async function getRequestById(id: string): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>(`/api/faculty/requests/${id}`);
}

export async function createSwapRequest(data: CreateSwapRequestInput): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/swap", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createRescheduleRequest(data: CreateRescheduleRequestInput): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/reschedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createLeaveRequest(data: CreateLeaveRequestInput): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>("/api/faculty/requests/leave", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function withdrawRequest(id: string): Promise<ApiResponse<FacultyRequest>> {
  return fetchApi<FacultyRequest>(`/api/faculty/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "withdraw" }),
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

export async function getNotifications(params?: NotificationsParams): Promise<PaginatedResponse<FacultyNotification>> {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("limit", String(params.pageSize));

  const query = searchParams.toString();
  const res = await fetchApi<NotificationsApiResponse>(`/api/faculty/notifications${query ? `?${query}` : ""}`);

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch notifications" };
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

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return fetchApi<{ count: number }>("/api/faculty/notifications/unread-count");
}

export async function markNotificationAsRead(id: string): Promise<ApiResponse<FacultyNotification>> {
  return fetchApi<FacultyNotification>(`/api/faculty/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ count: number }>> {
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
  const res = await fetchApi<ClassOptionsApiResponse>("/api/faculty/classes/options");

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch class options" };
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

export async function getColleagueOptions(): Promise<ApiResponse<ColleagueOption[]>> {
  const res = await fetchApi<ColleagueOptionsApiResponse>("/api/faculty/colleagues/options");

  if (!res.success || !res.data) {
    return { success: false, error: res.error || "Failed to fetch colleague options" };
  }

  const colleagues = Array.isArray(res.data.colleagues)
    ? res.data.colleagues
    : Array.isArray(res.data)
    ? res.data
    : [];

  return { success: true, data: colleagues };
}
```

---

## 3. Timetable Page

**File:** `app/faculty/timetable/page.tsx`

A full calendar interface with Day, Week, and Month views for managing teaching schedules.

```tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, getDayName } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import { useTimetable } from "@/hooks/use-faculty";

type ViewMode = "day" | "week" | "month";

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const typeBorder: Record<string, string> = {
  LECTURE: "border-l-blue-500 bg-blue-50/70 dark:bg-blue-950/30",
  LAB: "border-l-green-500 bg-green-50/70 dark:bg-green-950/30",
  TUTORIAL: "border-l-purple-500 bg-purple-50/70 dark:bg-purple-950/30",
  SEMINAR: "border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30",
  OFFICE_HOURS: "border-l-gray-400 bg-gray-50/70 dark:bg-zinc-800/30",
};

const typeDot: Record<string, string> = {
  LECTURE: "bg-blue-500",
  LAB: "bg-green-500",
  TUTORIAL: "bg-purple-500",
  SEMINAR: "bg-amber-500",
  OFFICE_HOURS: "bg-gray-400",
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const grid: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return grid;
}

function getField(item: any, ...keys: string[]): string {
  for (const k of keys) {
    if (item[k] != null && item[k] !== "") return String(item[k]);
  }
  return "";
}

function ClassCard({ item, compact = false }: { item: any; compact?: boolean }) {
  const name = getField(item, "courseName", "course_name", "name");
  const code = getField(item, "courseCode", "course_code", "code");
  const start = getField(item, "startTime", "start_time");
  const end = getField(item, "endTime", "end_time");
  const room = getField(item, "roomName", "room_name", "room");
  const bldg = getField(item, "building");
  const type = getField(item, "type") || "LECTURE";
  const section = getField(item, "section");

  if (compact) {
    return (
      <div
        className={`rounded border-l-2 px-2 py-1 text-xs ${
          typeBorder[type] || typeBorder.OFFICE_HOURS
        } cursor-default hover:opacity-80 transition-opacity`}
      >
        <p className="font-medium truncate">{name}</p>
        {start && <p className="text-[10px] text-muted-foreground">{formatTime(start)}</p>}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-l-4 p-3 ${
        typeBorder[type] || typeBorder.OFFICE_HOURS
      } transition-all hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight">{name}</h4>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {type}
        </Badge>
      </div>
      {code && (
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">
          {code}
          {section ? ` - Section ${section}` : ""}
        </p>
      )}
      <div className="mt-2 space-y-1">
        {start && end && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(start)} - {formatTime(end)}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {room || "TBA"}
          {bldg ? ` • ${bldg}` : ""}
        </p>
      </div>
    </div>
  );
}

function MonthView({
  year,
  month,
  schedule,
  today,
}: {
  year: number;
  month: number;
  schedule: any[];
  today: Date;
}) {
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function getClassesForDate(date: Date) {
    const jsDayIdx = date.getDay();
    const dayName = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][jsDayIdx];
    return schedule.filter((s) => {
      const d = getField(s, "dayOfWeek", "day_of_week", "day");
      return d.toUpperCase() === dayName;
    });
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0 bg-muted/30"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const classes = cell.isCurrentMonth ? getClassesForDate(cell.date) : [];
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

          return (
            <div
              key={idx}
              className={`min-h-[120px] border-r border-b last:border-r-0 p-1.5 transition-colors ${
                !cell.isCurrentMonth
                  ? "bg-muted/20"
                  : isWeekend
                  ? "bg-muted/10"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : !cell.isCurrentMonth
                      ? "text-muted-foreground/40"
                      : isWeekend
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-foreground"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {classes.slice(0, 3).map((item: any, i: number) => (
                  <ClassCard key={item.id || i} item={item} compact />
                ))}
                {classes.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    +{classes.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  weekStart,
  schedule,
  today,
}: {
  weekStart: Date;
  schedule: any[];
  today: Date;
}) {
  const TIME_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-8">
        <div className="border-r border-b py-3 px-2 bg-muted/30" />
        {WEEKDAY_NAMES.map((day, i) => {
          const date = addDays(weekStart, i);
          const isToday = isSameDay(date, today);
          return (
            <div
              key={day}
              className={`border-r border-b last:border-r-0 py-3 text-center bg-muted/30 ${
                isToday ? "bg-blue-50 dark:bg-blue-950/30" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground">{day}</p>
              <p
                className={`text-lg font-semibold mt-0.5 ${
                  isToday ? "text-blue-600 dark:text-blue-400" : ""
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-8">
        {TIME_HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-r border-b py-3 px-2 text-right">
              <span className="text-[11px] text-muted-foreground">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
              </span>
            </div>
            {WEEKDAY_FULL.map((dayName, dayIdx) => {
              const dayClasses = schedule.filter((s) => {
                const d = getField(s, "dayOfWeek", "day_of_week", "day").toUpperCase();
                const startHour = parseInt(
                  getField(s, "startTime", "start_time").split(":")[0] || "0"
                );
                return d === dayName && startHour === hour;
              });
              const date = addDays(weekStart, dayIdx);
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={`${hour}-${dayName}`}
                  className={`border-r border-b last:border-r-0 p-1 min-h-[60px] ${
                    isToday ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                  }`}
                >
                  {dayClasses.map((item: any, i: number) => (
                    <ClassCard key={item.id || i} item={item} compact />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ date, schedule }: { date: Date; schedule: any[] }) {
  const jsDayIdx = date.getDay();
  const dayName = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][jsDayIdx];

  const dayClasses = schedule
    .filter(
      (s) => getField(s, "dayOfWeek", "day_of_week", "day").toUpperCase() === dayName
    )
    .sort((a, b) =>
      getField(a, "startTime", "start_time").localeCompare(
        getField(b, "startTime", "start_time")
      )
    );

  const TIME_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-[80px_1fr]">
        {TIME_HOURS.map((hour) => {
          const hourClasses = dayClasses.filter((s) => {
            const startHour = parseInt(
              getField(s, "startTime", "start_time").split(":")[0] || "0"
            );
            return startHour === hour;
          });
          return (
            <div key={hour} className="contents">
              <div className="border-r border-b py-4 px-3 text-right">
                <span className="text-xs text-muted-foreground">
                  {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                </span>
              </div>
              <div className="border-b p-2 min-h-[80px]">
                <div className="space-y-2">
                  {hourClasses.map((item: any, i: number) => (
                    <ClassCard key={item.id || i} item={item} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weekStart = getMonday(currentDate);

  const { data: rawData, isLoading } = useTimetable({});
  const schedule = Array.isArray(rawData) ? rawData.filter(Boolean) : [];

  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const headerLabel = (() => {
    if (view === "month") return `${MONTH_NAMES[month]} ${year}`;
    if (view === "week") {
      const end = addDays(weekStart, 6);
      return `${weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} — ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{headerLabel}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-none border-x px-4 text-xs font-medium"
              onClick={goToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => navigate(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-r-none text-xs"
              onClick={() => setView("day")}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-none border-x text-xs"
              onClick={() => setView("week")}
            >
              <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="h-9 rounded-l-none text-xs"
              onClick={() => setView("month")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Month
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(typeDot).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ")}
          </span>
        ))}
      </div>

      {view === "month" && (
        <MonthView year={year} month={month} schedule={schedule} today={today} />
      )}
      {view === "week" && (
        <WeekView weekStart={weekStart} schedule={schedule} today={today} />
      )}
      {view === "day" && <DayView date={currentDate} schedule={schedule} />}
    </div>
  );
}
```

---

## 4. Availability Page

**File:** `app/faculty/availability/page.tsx`

Centered layout for managing faculty availability preferences.

```tsx
"use client";

import { FacultyHeader } from "@/components/faculty/faculty-header";
import { AvailabilityForm } from "@/components/faculty/availability-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailability, useUnreadCount, useUpdateAvailability } from "@/hooks/use-faculty";
import { toast } from "sonner";
import type { UpdateAvailabilityInput } from "@/lib/validations/faculty";

function AvailabilitySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AvailabilityPage() {
  const { data: availability, isLoading, error, mutate } = useAvailability();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { trigger: updateAvailabilityMutation, isMutating } = useUpdateAvailability();

  const handleSave = async (formData: UpdateAvailabilityInput) => {
    try {
      await updateAvailabilityMutation(formData);
      await mutate();
      toast.success("Availability updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
      throw err;
    }
  };

  if (error) {
    return (
      <>
        <FacultyHeader
          title="Availability"
          description="Set your preferred working days and time slots"
          unreadNotifications={0}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-6">
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive">
                    Failed to load availability
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FacultyHeader
        title="Availability"
        description="Set your preferred working days and time slots"
        unreadNotifications={unreadCount}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          {isLoading || !availability ? (
            <AvailabilitySkeleton />
          ) : (
            <AvailabilityForm
              availability={availability}
              onSave={handleSave}
              isSubmitting={isMutating}
            />
          )}
        </div>
      </div>
    </>
  );
}
```

---

## 5. Requests Page

**File:** `app/faculty/requests/page.tsx`

Centered layout for managing swap, reschedule, and leave requests.

```tsx
"use client";

import { useState } from "react";
import { Plus, ArrowLeftRight, CalendarClock, CalendarOff } from "lucide-react";
import { FacultyHeader } from "@/components/faculty/faculty-header";
import { RequestsList } from "@/components/faculty/requests-list";
import {
  SwapRequestDialog,
  RescheduleRequestDialog,
  LeaveRequestDialog,
} from "@/components/faculty/request-dialogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRequests,
  useClassOptions,
  useColleagueOptions,
  useUnreadCount,
  useWithdrawRequest,
} from "@/hooks/use-faculty";
import { RequestStatus } from "@/lib/types/faculty";
import { toast } from "sonner";

function RequestsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RequestsPage() {
  const [swapOpen, setSwapOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data: requestsData, isLoading, error, mutate } = useRequests();
  const { data: classOptions = [] } = useClassOptions();
  const { data: colleagueOptions = [] } = useColleagueOptions();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { trigger: withdrawMutation } = useWithdrawRequest();

  const requests = requestsData?.data ?? [];

  const pendingRequests = requests.filter(
    (r) => r.status === RequestStatus.PENDING
  );
  const processedRequests = requests.filter(
    (r) =>
      r.status === RequestStatus.APPROVED ||
      r.status === RequestStatus.REJECTED ||
      r.status === RequestStatus.WITHDRAWN
  );

  const handleWithdraw = async (requestId: string) => {
    try {
      await withdrawMutation(requestId);
      await mutate();
      toast.success("Request withdrawn successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw request");
    }
  };

  const handleRequestSuccess = () => {
    mutate();
  };

  if (error) {
    return (
      <>
        <FacultyHeader
          title="Requests"
          description="Manage your swap, reschedule, and leave requests"
          unreadNotifications={0}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-6">
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-destructive">
                    Failed to load requests
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FacultyHeader
        title="Requests"
        description="Manage your swap, reschedule, and leave requests"
        unreadNotifications={unreadCount}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSwapOpen(true)}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Class Swap
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLeaveOpen(true)}>
                  <CalendarOff className="mr-2 h-4 w-4" />
                  Leave Request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingRequests.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {isLoading ? (
                <RequestsSkeleton />
              ) : (
                <RequestsList
                  requests={pendingRequests}
                  onView={(request) => console.log("View:", request.id)}
                  onWithdraw={(request) => handleWithdraw(request.id)}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {isLoading ? (
                <RequestsSkeleton />
              ) : (
                <RequestsList
                  requests={processedRequests}
                  onView={(request) => console.log("View:", request.id)}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SwapRequestDialog
        open={swapOpen}
        onOpenChange={setSwapOpen}
        myClasses={classOptions}
        colleagues={colleagueOptions}
        onSuccess={handleRequestSuccess}
      />
      <RescheduleRequestDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        myClasses={classOptions}
        onSuccess={handleRequestSuccess}
      />
      <LeaveRequestDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onSuccess={handleRequestSuccess}
      />
    </>
  );
}
```

---

## 6. Profile Page

**File:** `app/faculty/profile/page.tsx`

Complete profile management with sections for contact info, academic information, social links, and notification preferences.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-faculty";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import {
  Plus,
  X,
  Loader2,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Clock,
  GraduationCap,
  BookOpen,
  FileText,
  Globe,
  Linkedin,
  Github,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: profile, isLoading, mutate } = useProfile();
  const { trigger: updateProfile, isMutating } = useUpdateProfile();

  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [publications, setPublications] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [scholar, setScholar] = useState("");
  const [website, setWebsite] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newPublication, setNewPublication] = useState("");

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setBio(p.bio || "");
      setPhone(p.phone || "");
      setOfficeLocation(p.officeLocation || p.office_location || "");
      setOfficeHours(p.officeHours || p.office_hours || "");
      setResearchInterests(p.researchInterests || p.research_interests || []);
      setQualifications(p.qualifications || []);
      setPublications(p.publications || []);
      const links = p.socialLinks || p.social_links || {};
      setLinkedin(links.linkedin || "");
      setGithub(links.github || "");
      setScholar(links.scholar || links.googleScholar || "");
      setWebsite(links.website || "");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({
        bio,
        phone,
        officeLocation,
        officeHours,
        researchInterests,
        qualifications,
        publications,
        socialLinks: { linkedin, github, scholar, website },
      } as any);
      toast.success("Profile updated successfully");
      mutate();
    } catch {
      toast.error("Failed to update profile");
    }
  }

  function addItem(
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    setValue: (v: string) => void,
    max: number
  ) {
    if (value.trim() && list.length < max) {
      setList([...list, value.trim()]);
      setValue("");
    }
  }

  function removeItem(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  const p = (profile || {}) as any;
  const name = p.name || p.faculty?.user?.name || "Faculty Member";
  const email = p.email || p.faculty?.user?.email || "";
  const designation = p.designation || p.faculty?.designation || "";
  const department = p.department || p.faculty?.department?.name || "";
  const employeeId = p.employeeId || p.faculty?.employeeId || p.employee_id || "";
  const joiningDate = p.joiningDate || p.faculty?.joiningDate || p.joining_date || "";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <div className="space-y-12">
        {/* Profile Overview */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold leading-7">Profile</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your public faculty profile information.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium leading-6">Photo</label>
              <div className="mt-2 flex items-center gap-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xl font-bold shrink-0">
                  {getInitials(name)}
                </div>
                <div>
                  <p className="text-lg font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {designation}
                    {department ? ` • ${department}` : ""}
                  </p>
                  {employeeId && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {employeeId}
                      {joiningDate && ` • Joined ${new Date(joiningDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="bio" className="block text-sm font-medium leading-6">
                About / Bio
              </label>
              <div className="mt-2">
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a few sentences about yourself, your research focus, and teaching philosophy..."
                  className="block w-full rounded-md bg-background px-3 py-1.5 text-sm outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{bio.length}/1000 characters</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold leading-7">Contact Information</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            How students and colleagues can reach you.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium leading-6">
                Email address
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-muted/50 px-3 py-1.5 outline outline-1 -outline-offset-1 outline-border">
                  <Mail className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="text-sm text-muted-foreground">{email || "Not set"}</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Contact admin to change email</p>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium leading-6">
                Phone number
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <Phone className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0123"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="office" className="block text-sm font-medium leading-6">
                Office location
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <MapPin className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="office"
                    name="office"
                    type="text"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="CS Block, Room 201"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="hours" className="block text-sm font-medium leading-6">
                Office hours
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <Clock className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="hours"
                    name="hours"
                    type="text"
                    value={officeHours}
                    onChange={(e) => setOfficeHours(e.target.value)}
                    placeholder="Mon & Fri 2:00 PM - 4:00 PM"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold leading-7">Academic Information</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your research interests, qualifications, and publications.
          </p>
          <div className="mt-10 space-y-10">
            {/* Research Interests */}
            <div>
              <label className="block text-sm font-medium leading-6">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Research Interests
                </span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Add up to 20 research areas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {researchInterests.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem(researchInterests, setResearchInterests, i)}
                      className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(researchInterests, setResearchInterests, newInterest, setNewInterest, 20);
                    }
                  }}
                  className="block w-full rounded-md bg-background px-3 py-1.5 text-sm outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    addItem(researchInterests, setResearchInterests, newInterest, setNewInterest, 20)
                  }
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium leading-6">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  Qualifications
                </span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Add up to 10 academic qualifications</p>
              <div className="mt-3 space-y-2">
                {qualifications.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 group"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(qualifications, setQualifications, i)}
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 max-w-lg">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science — MIT"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(qualifications, setQualifications, newQualification, setNewQualification, 10);
                    }
                  }}
                  className="block w-full rounded-md bg-background px-3 py-1.5 text-sm outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    addItem(qualifications, setQualifications, newQualification, setNewQualification, 10)
                  }
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Publications */}
            <div>
              <label className="block text-sm font-medium leading-6">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Publications
                </span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Add up to 50 published works</p>
              <div className="mt-3 space-y-2">
                {publications.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-2.5 group"
                  >
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                      [{i + 1}]
                    </span>
                    <span className="text-sm flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(publications, setPublications, i)}
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newPublication}
                  onChange={(e) => setNewPublication(e.target.value)}
                  placeholder="Title — Journal/Conference — Year"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(publications, setPublications, newPublication, setNewPublication, 50);
                    }
                  }}
                  className="block w-full rounded-md bg-background px-3 py-1.5 text-sm outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    addItem(publications, setPublications, newPublication, setNewPublication, 50)
                  }
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Professional Links */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold leading-7">Social & Professional Links</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Connect your professional profiles so colleagues can find you.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="linkedin" className="block text-sm font-medium leading-6">
                LinkedIn
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <Linkedin className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="github" className="block text-sm font-medium leading-6">
                GitHub
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <Github className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="github"
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/yourname"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="scholar" className="block text-sm font-medium leading-6">
                Google Scholar
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <GraduationCap className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="scholar"
                    type="url"
                    value={scholar}
                    onChange={(e) => setScholar(e.target.value)}
                    placeholder="https://scholar.google.com/..."
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="website" className="block text-sm font-medium leading-6">
                Personal Website
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-background outline outline-1 -outline-offset-1 outline-border focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500">
                  <Globe className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="block w-full bg-transparent py-1.5 px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="border-b border-border pb-12">
          <h2 className="text-base font-semibold leading-7">Notification Preferences</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose what notifications you want to receive.
          </p>
          <div className="mt-10 space-y-10">
            <fieldset>
              <legend className="text-sm font-semibold leading-6">By email</legend>
              <div className="mt-6 space-y-6">
                {[
                  {
                    id: "schedule-changes",
                    label: "Schedule Changes",
                    desc: "Get notified when your schedule is updated or a room changes.",
                    defaultChecked: true,
                  },
                  {
                    id: "request-updates",
                    label: "Request Updates",
                    desc: "Get notified when your leave/swap/reschedule requests are approved or rejected.",
                    defaultChecked: true,
                  },
                  {
                    id: "announcements",
                    label: "Department Announcements",
                    desc: "Receive announcements from your department and administration.",
                    defaultChecked: false,
                  },
                ].map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex h-6 shrink-0 items-center">
                      <input
                        defaultChecked={item.defaultChecked}
                        id={item.id}
                        name={item.id}
                        type="checkbox"
                        className="h-4 w-4 rounded border-border bg-transparent text-blue-600 focus:ring-blue-500 focus:ring-offset-0 accent-blue-600"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor={item.id} className="font-medium">
                        {item.label}
                      </label>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold leading-6">Push notifications</legend>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                How you receive in-app notifications.
              </p>
              <div className="mt-6 space-y-6">
                {[
                  { id: "push-all", label: "Everything", defaultChecked: true },
                  { id: "push-important", label: "Important only", defaultChecked: false },
                  { id: "push-none", label: "No push notifications", defaultChecked: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-x-3">
                    <input
                      defaultChecked={item.defaultChecked}
                      id={item.id}
                      name="push-notifications"
                      type="radio"
                      className="h-4 w-4 border-border bg-transparent text-blue-600 focus:ring-blue-500 focus:ring-offset-0 accent-blue-600"
                    />
                    <label htmlFor={item.id} className="block text-sm font-medium leading-6">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-x-4 pb-12">
        <button
          type="button"
          className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            if (profile) {
              const p = profile as any;
              setBio(p.bio || "");
              setPhone(p.phone || "");
              setOfficeLocation(p.officeLocation || "");
              setOfficeHours(p.officeHours || "");
              setResearchInterests(p.researchInterests || []);
              setQualifications(p.qualifications || []);
              setPublications(p.publications || []);
              const links = p.socialLinks || {};
              setLinkedin(links.linkedin || "");
              setGithub(links.github || "");
              setScholar(links.scholar || "");
              setWebsite(links.website || "");
            }
            toast.info("Changes discarded");
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isMutating}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isMutating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
```

---

## Summary of Changes (Session 2)

### Database Migration
| Component | Before | After |
|-----------|--------|-------|
| API Routes | Mock data arrays | Prisma + PostgreSQL |
| Data Storage | In-memory `Map` | Database tables |
| User Data | Global demo data | Per-user isolation |
| Faculty Creation | Manual | Auto-create on first visit |

### Files Updated

| File | Change Description |
|------|-------------------|
| `lib/db.ts` | Added `ensureFacultyExists()` helper for auto-creation |
| `lib/api/auth-helper.ts` | Fixed import: `@/lib/prisma` → `@/lib/db` |
| `app/api/faculty/dashboard/route.ts` | Database-backed with per-user data |
| `app/api/faculty/profile/route.ts` | Database-backed profile operations |
| `app/api/faculty/availability/route.ts` | Database-backed + course eligibility |
| `app/api/faculty/timetable/route.ts` | Database-backed schedule queries |
| `app/api/faculty/timetable/today/route.ts` | Database-backed today's schedule |
| `app/api/faculty/requests/route.ts` | Database-backed request management |
| `app/api/faculty/notifications/route.ts` | Database-backed notifications |
| `app/api/faculty/notifications/unread-count/route.ts` | Database-backed unread count |
| `app/api/faculty/notifications/[id]/read/route.ts` | Database-backed mark as read |
| `app/api/faculty/notifications/read-all/route.ts` | Database-backed mark all as read |
| `hooks/use-faculty.ts` | Added `globalMutate` for SWR revalidation |
| `components/faculty/availability-form.tsx` | Added course eligibility UI |
| `prisma/seed.ts` | Created seed data for departments/courses/rooms |
| `package.json` | Added `db:generate`, `db:push`, `db:seed`, `db:studio` scripts |

### Bugs Fixed

1. **Prisma Import Error**: Fixed `@/lib/prisma` → `@/lib/db` in auth-helper
2. **In-Memory Store Reset**: Migrated to database persistence
3. **Turbopack Cache Corruption**: Clear `.next` directory resolves panics
4. **Wrong User Data**: Database queries now filter by session user ID

---

## Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npx prisma generate

# Push schema changes to database
npx prisma db push

# Seed database with departments/courses/rooms
npm run db:seed

# Clear Next.js cache (fixes Turbopack panics)
rm -rf .next

# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Open Prisma Studio (database viewer)
npm run db:studio
```

### npm Scripts

```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

---

*End of Document*
