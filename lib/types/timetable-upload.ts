import type { DayOfWeek, ScheduleItemType } from "@prisma/client";

export type TimetableFileType = "csv" | "xlsx" | "pdf";

export interface ParsedTimetableEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseCode?: string;
  courseName?: string;
  roomNumber?: string;
  building?: string;
  type: ScheduleItemType;
  section?: string;
  program?: string;
  semester?: number;
  studentCount?: number;
}

export interface TimetableUploadResult {
  success: boolean;
  filename: string;
  fileType: TimetableFileType;
  entriesParsed: number;
  entriesCreated: number;
  entriesSkipped: number;
  warnings: string[];
  errors: string[];
  preview?: ParsedTimetableEntry[];
}

export interface TimetableUploadValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ColumnMapping {
  dayOfWeek: string[];
  startTime: string[];
  endTime: string[];
  courseCode: string[];
  courseName: string[];
  roomNumber: string[];
  building: string[];
  type: string[];
  section: string[];
  program: string[];
  semester: string[];
  studentCount: string[];
}

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  dayOfWeek: ["day", "day_of_week", "weekday", "dayofweek", "dow"],
  startTime: [
    "start",
    "start_time",
    "starttime",
    "from",
    "begin",
    "time_start",
  ],
  endTime: ["end", "end_time", "endtime", "to", "finish", "time_end"],
  courseCode: ["course_code", "coursecode", "code", "course_id", "courseid"],
  courseName: [
    "course",
    "course_name",
    "coursename",
    "subject",
    "class",
    "title",
  ],
  roomNumber: [
    "room",
    "room_number",
    "roomnumber",
    "location",
    "venue",
    "classroom",
  ],
  building: ["building", "bldg", "block", "wing"],
  type: [
    "type",
    "class_type",
    "classtype",
    "session_type",
    "sessiontype",
    "kind",
  ],
  section: ["section", "sec", "group"],
  program: ["program", "programme", "course_program", "degree"],
  semester: ["semester", "sem", "term", "year"],
  studentCount: ["student_count", "studentcount", "students", "enrollment", "count"],
};

export const DAY_OF_WEEK_MAP: Record<string, DayOfWeek> = {
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
  sunday: "SUNDAY",
  mon: "MONDAY",
  tue: "TUESDAY",
  wed: "WEDNESDAY",
  thu: "THURSDAY",
  fri: "FRIDAY",
  sat: "SATURDAY",
  sun: "SUNDAY",
  m: "MONDAY",
  t: "TUESDAY",
  w: "WEDNESDAY",
  th: "THURSDAY",
  f: "FRIDAY",
  s: "SATURDAY",
  su: "SUNDAY",
  "1": "MONDAY",
  "2": "TUESDAY",
  "3": "WEDNESDAY",
  "4": "THURSDAY",
  "5": "FRIDAY",
  "6": "SATURDAY",
  "7": "SUNDAY",
  "0": "SUNDAY",
};

export const SCHEDULE_TYPE_MAP: Record<string, ScheduleItemType> = {
  lecture: "LECTURE",
  lab: "LAB",
  laboratory: "LAB",
  tutorial: "TUTORIAL",
  seminar: "SEMINAR",
  office_hours: "OFFICE_HOURS",
  officehours: "OFFICE_HOURS",
  office: "OFFICE_HOURS",
};
