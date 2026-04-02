export * from "./faculty";

export interface DashboardData {
  classesThisWeek: number;
  totalStudents: number;
  pendingRequests: number;
  officeHours: string;
  todaySchedule: ScheduleItem[];
  upcomingClasses: ScheduleItem[];
  recentNotifications: NotificationItem[];
}

export interface ScheduleItem {
  id: string;
  courseName: string;
  courseCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  building: string;
  type: string;
  section?: string;
  program?: string;
  semester?: number;
}

export interface FacultyProfileData {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  departmentCode: string;
  employeeId: string;
  joiningDate: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  officeLocation?: string;
  officeHours?: string;
  researchInterests: string[];
  qualifications: string[];
  publications: string[];
  socialLinks: Record<string, string>;
}

export interface AvailabilityData {
  preferredSlot: string;
  customStartTime?: string;
  customEndTime?: string;
  unavailableStart?: string;
  unavailableEnd?: string;
  notes?: string;
  days: { dayOfWeek: string; isAvailable: boolean }[];
}

export interface RequestItem {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  requestDate: string;
  effectiveDate: string;
  endDate?: string;
  reason: string;
  targetFacultyName?: string;
  timeline: { status: string; comment?: string; createdAt: string; createdBy: string }[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ClassOptionData {
  id: string;
  label: string;
  courseCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ColleagueOptionData {
  id: string;
  name: string;
  department: string;
  designation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}
