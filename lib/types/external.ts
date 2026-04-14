export const CourseStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const ProgramStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type ProgramStatus = (typeof ProgramStatus)[keyof typeof ProgramStatus];

export const SemesterType = {
  FALL: "FALL",
  WINTER: "WINTER",
  SUMMER: "SUMMER",
} as const;
export type SemesterType = (typeof SemesterType)[keyof typeof SemesterType];

export const RoomStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  MAINTENANCE: "MAINTENANCE",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const RoomType = {
  CLASSROOM: "CLASSROOM",
  LAB: "LAB",
  LECTURE_HALL: "LECTURE_HALL",
  OFFICE: "OFFICE",
  COMMON_AREA: "COMMON_AREA",
  GYM: "GYM",
  OTHER: "OTHER",
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export interface ExternalDepartment {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalProgram {
  id: number;
  name: string;
  code: string;
  duration_years: number;
  status: ProgramStatus;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExternalCourse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  prerequisites: string[];
  credits: number;
  lecture_hours: number;
  lab_hours: number;
  status: CourseStatus;
  program_id: number;
  course_kind: "COMPULSORY" | "ELECTIVE";
  created_at: string;
  updated_at: string;
}

export interface ExternalSemester {
  id: number;
  year: number;
  type: SemesterType;
  created_at: string;
  updated_at: string;
}

export interface ExternalTerm {
  id: number;
  semester_id: number;
  course_id: number;
  created_at: string;
}

export interface ExternalCampus {
  id: string;
  name: string;
  address: string;
  timezone: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapZoom: number | null;
  mapLocationLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalBuilding {
  id: string;
  campusId: string;
  name: string;
  buildingCode: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalRoom {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  description: string | null;
  currentStatus: RoomStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  building?: ExternalBuilding;
}

export interface ExternalRoomWithDetails extends ExternalRoom {
  building: ExternalBuilding & {
    campus: ExternalCampus;
  };
  tags: Array<{
    id: string;
    tagName: string;
    colorCode: string;
  }>;
  assets: Array<{
    id: string;
    itemName: string;
    quantity: number;
    isFunctional: boolean;
  }>;
}

export interface ExternalRoomAvailability {
  roomId: string;
  available: boolean;
  reason: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  currentSlot?: {
    courseCode: string;
    courseName: string;
    instructor: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  isFallback: boolean;
}

export interface ExternalRoomTimetableSlot {
  courseCode: string;
  courseName: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ExternalRoomTimetable {
  roomId: string;
  isFallback: boolean;
  slots: ExternalRoomTimetableSlot[];
}

export interface ExternalRoomsResponse {
  data: ExternalRoomWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExternalCoursesResponse {
  data: ExternalCourse[];
}

export interface ExternalDepartmentsResponse {
  data: ExternalDepartment[];
}

export interface ExternalProgramsResponse {
  data: ExternalProgram[];
}

export interface CourseOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  programId: number;
  programName?: string;
}

export interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

export interface RoomOption {
  id: string;
  roomNumber: string;
  building: string;
  buildingCode: string;
  campus: string;
  capacity: number;
  roomType: RoomType;
  currentStatus: RoomStatus;
  label: string;
}
