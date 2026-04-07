// ============================================================================
// Enums
// ============================================================================

export const AppRole = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  STUDENT: "STUDENT",
  SCHEDULER: "SCHEDULER",
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const RequestType = {
  SWAP: "SWAP",
  RESCHEDULE: "RESCHEDULE",
  LEAVE: "LEAVE",
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const RequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const NotificationType = {
  REQUEST_UPDATE: "REQUEST_UPDATE",
  SCHEDULE_CHANGE: "SCHEDULE_CHANGE",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  REMINDER: "REMINDER",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const ScheduleItemType = {
  LECTURE: "LECTURE",
  LAB: "LAB",
  TUTORIAL: "TUTORIAL",
  SEMINAR: "SEMINAR",
  OFFICE_HOURS: "OFFICE_HOURS",
} as const;
export type ScheduleItemType =
  (typeof ScheduleItemType)[keyof typeof ScheduleItemType];

export const PreferredSlot = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  ANY: "ANY",
} as const;
export type PreferredSlot = (typeof PreferredSlot)[keyof typeof PreferredSlot];

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const FacultyStatus = {
  ACTIVE: "ACTIVE",
  ON_LEAVE: "ON_LEAVE",
  INACTIVE: "INACTIVE",
} as const;
export type FacultyStatus = (typeof FacultyStatus)[keyof typeof FacultyStatus];

export const AssignmentStatus = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

// ============================================================================
// Base Entities
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  departmentId: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
}

// ============================================================================
// Faculty Entities
// ============================================================================

export interface Faculty {
  id: string;
  userId: string;
  departmentId: string;
  employeeId: string;
  designation: string;
  joiningDate: Date;
  status: FacultyStatus;
  user: User;
  department: Department;
}

export interface FacultyProfile {
  id: string;
  facultyId: string;
  bio: string | null;
  phone: string | null;
  officeLocation: string | null;
  officeHours: string | null;
  researchInterests: string[];
  qualifications: string[];
  publications: string[];
  socialLinks: Record<string, string>;
}

export interface FacultyScheduleItem {
  id: string;
  facultyId: string;
  courseId: string;
  roomId: string;
  termId: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  type: ScheduleItemType;
  section: string | null;
  program: string | null;
  semester: number | null;
  academicYear: string;
  isActive: boolean;
  assignmentStatus: AssignmentStatus;
  studentCount: number | null;
  startDate: string | null;
  endDate: string | null;
  course: Course;
  room: Room;
}

export interface FacultyAvailability {
  id: string;
  facultyId: string;
  preferredSlot: PreferredSlot;
  customStartTime: string | null;
  customEndTime: string | null;
  unavailableStart: string | null;
  unavailableEnd: string | null;
  notes: string | null;
  days: FacultyAvailabilityDay[];
}

export interface FacultyAvailabilityDay {
  id: string;
  availabilityId: string;
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface FacultyRequest {
  id: string;
  facultyId: string;
  type: RequestType;
  status: RequestStatus;
  title: string;
  description: string | null;
  requestDate: Date;
  effectiveDate: Date;
  endDate: Date | null;
  targetFacultyId: string | null;
  targetScheduleId: string | null;
  newDate: Date | null;
  newStartTime: string | null;
  newEndTime: string | null;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: FacultyRequestTimeline[];
  targetFaculty?: Faculty;
  targetSchedule?: FacultyScheduleItem;
}

export interface FacultyRequestTimeline {
  id: string;
  requestId: string;
  status: RequestStatus;
  comment: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface FacultyNotification {
  id: string;
  facultyId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface UpdateProfileRequest {
  bio?: string | null;
  phone?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;
  researchInterests?: string[];
  qualifications?: string[];
  publications?: string[];
  socialLinks?: Record<string, string>;
}

export interface UpdateAvailabilityRequest {
  preferredSlot: PreferredSlot;
  customStartTime?: string | null;
  customEndTime?: string | null;
  unavailableStart?: string | null;
  unavailableEnd?: string | null;
  notes?: string | null;
  days: Array<{
    dayOfWeek: DayOfWeek;
    isAvailable: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }>;
}

export interface CreateSwapRequest {
  targetFacultyId: string;
  targetScheduleId: string;
  myScheduleId: string;
  effectiveDate: string;
  reason: string;
}

export interface CreateRescheduleRequest {
  scheduleId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

export interface CreateLeaveRequest {
  effectiveDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateRequestRequest {
  status?: RequestStatus;
  reason?: string;
}

export interface TimetableQueryParams {
  weekStart?: string;
  courseCode?: string;
  program?: string;
  view?: "week" | "day" | "month";
}

// ============================================================================
// API Response Types
// ============================================================================

export interface DashboardSummaryCard {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: string;
}

export interface DashboardResponse {
  faculty: Pick<Faculty, "id" | "designation"> & {
    user: Pick<User, "name" | "email" | "avatarUrl">;
    department: Pick<Department, "name">;
  };
  summaryCards: DashboardSummaryCard[];
  todaySchedule: FacultyScheduleItem[];
  upcomingSchedule: FacultyScheduleItem[];
  recentNotifications: FacultyNotification[];
  pendingRequests: number;
}

export interface ProfileResponse {
  faculty: Faculty;
  profile: FacultyProfile;
}

export interface TimetableResponse {
  items: FacultyScheduleItem[];
  weekStart: string;
  weekEnd: string;
}

export interface AvailabilityResponse {
  availability: FacultyAvailability;
}

export interface RequestsResponse {
  requests: FacultyRequest[];
  total: number;
}

export interface RequestDetailResponse {
  request: FacultyRequest;
}

export interface NotificationsResponse {
  notifications: FacultyNotification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ClassOption {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export interface ColleagueOption {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  avatarUrl: string | null;
}

export interface ClassOptionsResponse {
  classes: ClassOption[];
}

export interface ColleagueOptionsResponse {
  colleagues: ColleagueOption[];
}

export type FacultyDashboardData = DashboardResponse;
