import * as XLSX from "xlsx";
import pdf from "pdf-parse";
import {
  ParsedTimetableEntry,
  TimetableUploadResult,
  TimetableUploadValidation,
  TimetableFileType,
  DEFAULT_COLUMN_MAPPING,
  DAY_OF_WEEK_MAP,
  SCHEDULE_TYPE_MAP,
} from "@/lib/types/timetable-upload";
import type { DayOfWeek, ScheduleItemType } from "@prisma/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS: TimetableFileType[] = ["csv", "xlsx", "pdf"];

export function detectFileType(filename: string): TimetableFileType | null {
  const ext = filename.toLowerCase().split(".").pop() as TimetableFileType;
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : null;
}

export function validateFile(
  filename: string,
  fileSize: number,
): TimetableUploadValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fileType = detectFileType(filename);
  if (!fileType) {
    errors.push(
      `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`,
    );
  }

  if (fileSize > MAX_FILE_SIZE) {
    errors.push(
      `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  if (fileSize === 0) {
    errors.push("File is empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function findColumnIndex(
  headers: string[],
  columnKey: keyof typeof DEFAULT_COLUMN_MAPPING,
): number {
  const normalizedHeaders = headers.map(normalizeColumnName);
  const possibleNames = DEFAULT_COLUMN_MAPPING[columnKey];

  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    const index = normalizedHeaders.findIndex(
      (h) =>
        h === normalized || h.includes(normalized) || normalized.includes(h),
    );
    if (index !== -1) return index;
  }

  return -1;
}

function parseTimeValue(value: unknown): string {
  if (value == null) return "";

  const str = String(value).trim();

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    return str.substring(0, 5);
  }

  if (/^\d{3,4}$/.test(str)) {
    const digits = str.padStart(4, "0");
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  const timeMatch = str.match(/(\d{1,2}):?(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const hourMatch = str.match(/(\d{1,2})\s*(am|pm)/i);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1], 10);
    if (hourMatch[2].toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (hourMatch[2].toLowerCase() === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00`;
  }

  return str;
}

function parseDayValue(value: unknown): DayOfWeek | null {
  if (value == null) return null;

  const str = String(value).toLowerCase().trim();

  return DAY_OF_WEEK_MAP[str] || null;
}

function parseTypeValue(value: unknown): ScheduleItemType {
  if (value == null) return "LECTURE";

  const str = String(value)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "_");

  return SCHEDULE_TYPE_MAP[str] || "LECTURE";
}

function parseNumberValue(value: unknown): number | undefined {
  if (value == null) return undefined;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? undefined : num;
}

function parseRow(
  row: Record<string, unknown>,
  headers: string[],
): ParsedTimetableEntry | null {
  const dayIndex = findColumnIndex(headers, "dayOfWeek");
  const startIndex = findColumnIndex(headers, "startTime");
  const endIndex = findColumnIndex(headers, "endTime");

  const values = headers.map((_, i) => {
    const key = Object.keys(row)[i];
    return row[key!];
  });

  const dayOfWeek = parseDayValue(values[dayIndex] ?? row["day"] ?? row["Day"]);
  const startTime = parseTimeValue(
    values[startIndex] ?? row["start_time"] ?? row["Start"],
  );
  const endTime = parseTimeValue(
    values[endIndex] ?? row["end_time"] ?? row["End"],
  );

  if (!dayOfWeek || !startTime || !endTime) {
    return null;
  }

  const courseCodeIndex = findColumnIndex(headers, "courseCode");
  const courseNameIndex = findColumnIndex(headers, "courseName");
  const roomNumberIndex = findColumnIndex(headers, "roomNumber");
  const buildingIndex = findColumnIndex(headers, "building");
  const typeIndex = findColumnIndex(headers, "type");
  const sectionIndex = findColumnIndex(headers, "section");
  const programIndex = findColumnIndex(headers, "program");
  const semesterIndex = findColumnIndex(headers, "semester");

  return {
    dayOfWeek,
    startTime,
    endTime,
    courseCode:
      courseCodeIndex >= 0 ? String(values[courseCodeIndex] ?? "") : undefined,
    courseName:
      courseNameIndex >= 0 ? String(values[courseNameIndex] ?? "") : undefined,
    roomNumber:
      roomNumberIndex >= 0 ? String(values[roomNumberIndex] ?? "") : undefined,
    building:
      buildingIndex >= 0 ? String(values[buildingIndex] ?? "") : undefined,
    type: parseTypeValue(typeIndex >= 0 ? values[typeIndex] : "LECTURE"),
    section: sectionIndex >= 0 ? String(values[sectionIndex] ?? "") : undefined,
    program: programIndex >= 0 ? String(values[programIndex] ?? "") : undefined,
    semester:
      semesterIndex >= 0 ? parseNumberValue(values[semesterIndex]) : undefined,
  };
}

function deduplicateEntries(
  entries: ParsedTimetableEntry[],
): ParsedTimetableEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}-${entry.courseCode || entry.courseName || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseCSV(buffer: Buffer): ParsedTimetableEntry[] {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row",
    );
  }

  const headers = lines[0]
    .split(/[,;\t]/)
    .map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const entries: ParsedTimetableEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(/[,;\t]/)
      .map((v) => v.trim().replace(/^["']|["']$/g, ""));

    if (values.every((v) => !v)) continue;

    const row: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });

    const entry = parseRow(row, headers);
    if (entry) {
      entries.push(entry);
    }
  }

  return deduplicateEntries(entries);
}

export function parseExcel(buffer: Buffer): ParsedTimetableEntry[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file must have at least one sheet");
  }

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (data.length === 0) {
    throw new Error(
      "Excel sheet must have at least a header row and one data row",
    );
  }

  const headers = Object.keys(data[0] || {});
  const entries: ParsedTimetableEntry[] = [];

  for (const row of data) {
    const entry = parseRow(row, headers);
    if (entry) {
      entries.push(entry);
    }
  }

  return deduplicateEntries(entries);
}

export async function parsePDF(
  buffer: Buffer,
): Promise<ParsedTimetableEntry[]> {
  const data = await pdf(buffer);
  const text = data.text;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("PDF must contain timetable data in text format");
  }

  const tablePattern =
    /^(\w+)\s+(\d{1,2}[:]\d{2})\s*[-–]\s*(\d{1,2}[:]\d{2})\s+(.+)$/i;
  const entries: ParsedTimetableEntry[] = [];

  for (const line of lines) {
    const match = line.match(tablePattern);
    if (match) {
      const [, dayStr, startStr, endStr, rest] = match;
      const dayOfWeek = parseDayValue(dayStr);
      const startTime = parseTimeValue(startStr);
      const endTime = parseTimeValue(endStr);

      if (dayOfWeek && startTime && endTime) {
        const parts = rest.split(/\s{2,}|\t/);
        entries.push({
          dayOfWeek,
          startTime,
          endTime,
          courseName: parts[0]?.trim() || undefined,
          roomNumber: parts[1]?.trim() || undefined,
          type: parseTypeValue(parts[2]),
        });
      }
    }
  }

  if (entries.length === 0) {
    throw new Error(
      "Could not parse timetable from PDF. Please use CSV or Excel format for better reliability.",
    );
  }

  return deduplicateEntries(entries);
}

export async function parseTimetableFile(
  buffer: Buffer,
  filename: string,
): Promise<TimetableUploadResult> {
  const fileType = detectFileType(filename);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!fileType) {
    return {
      success: false,
      filename,
      fileType: "csv",
      entriesParsed: 0,
      entriesCreated: 0,
      entriesSkipped: 0,
      warnings: [],
      errors: [`Unsupported file type: ${filename}`],
    };
  }

  try {
    let entries: ParsedTimetableEntry[];

    switch (fileType) {
      case "csv":
        entries = parseCSV(buffer);
        break;
      case "xlsx":
        entries = parseExcel(buffer);
        break;
      case "pdf":
        entries = await parsePDF(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (entries.length === 0) {
      return {
        success: false,
        filename,
        fileType,
        entriesParsed: 0,
        entriesCreated: 0,
        entriesSkipped: 0,
        warnings: [],
        errors: ["No valid timetable entries found in file"],
      };
    }

    entries.forEach((entry, i) => {
      if (!entry.courseCode && !entry.courseName) {
        warnings.push(`Row ${i + 1}: No course identified`);
      }
      if (!entry.roomNumber) {
        warnings.push(`Row ${i + 1}: No room specified, will use TBA`);
      }
    });

    return {
      success: true,
      filename,
      fileType,
      entriesParsed: entries.length,
      entriesCreated: entries.length,
      entriesSkipped: 0,
      warnings,
      errors: [],
      preview: entries.slice(0, 20),
    };
  } catch (error) {
    return {
      success: false,
      filename,
      fileType,
      entriesParsed: 0,
      entriesCreated: 0,
      entriesSkipped: 0,
      warnings: [],
      errors: [
        error instanceof Error
          ? error.message
          : "Failed to parse timetable file",
      ],
    };
  }
}

// ============================================================================
// Availability Parsing
// ============================================================================

export interface ParsedAvailabilityDay {
  dayOfWeek: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ParsedAvailability {
  days: ParsedAvailabilityDay[];
  preferredSlot?: string;
  courseCodes: string[];
}

export interface AvailabilityParseResult {
  success: boolean;
  filename: string;
  daysParsed: number;
  coursesFound: string[];
  warnings: string[];
  errors: string[];
  preview?: ParsedAvailability;
}

function parseAvailabilityRow(
  row: Record<string, unknown>,
  headers: string[],
): ParsedAvailabilityDay | null {
  const dayColumn = findColumnIndex(headers, "dayOfWeek");
  const availableColumn = headers.findIndex((h) =>
    ["available", "is_available", "status", "working"].includes(
      h.toLowerCase().replace(/[_\s]/g, ""),
    ),
  );
  const startColumn = findColumnIndex(headers, "startTime");
  const endColumn = findColumnIndex(headers, "endTime");

  const dayValue =
    dayColumn >= 0 ? row[Object.keys(row)[dayColumn]] : row["day"];
  const availableValue =
    availableColumn >= 0
      ? row[Object.keys(row)[availableColumn]]
      : row["available"];
  const startValue =
    startColumn >= 0 ? row[Object.keys(row)[startColumn]] : row["start_time"];
  const endValue =
    endColumn >= 0 ? row[Object.keys(row)[endColumn]] : row["end_time"];

  if (!dayValue) return null;

  const dayStr = String(dayValue).toUpperCase().trim();
  const dayOfWeek = DAY_OF_WEEK_MAP[dayStr.toLowerCase()] || dayStr;

  let isAvailable = true;
  if (
    availableValue !== undefined &&
    availableValue !== null &&
    availableValue !== ""
  ) {
    const availStr = String(availableValue).toLowerCase();
    isAvailable = !["false", "no", "0", "off", "unavailable"].includes(
      availStr,
    );
  }

  const startTime = startValue ? parseTimeValue(startValue) : undefined;
  const endTime = endValue ? parseTimeValue(endValue) : undefined;

  return {
    dayOfWeek,
    isAvailable,
    startTime: isAvailable ? startTime || "09:00" : undefined,
    endTime: isAvailable ? endTime || "17:00" : undefined,
  };
}

function parseAvailabilityCSV(buffer: Buffer): ParsedAvailability {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0]
    .split(/[,;\t]/)
    .map((h) => h.trim().replace(/^["']|["']$/g, ""));

  const days: ParsedAvailabilityDay[] = [];
  let preferredSlot: string | undefined;
  let courseCodes: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(/[,;\t]/)
      .map((v) => v.trim().replace(/^["']|["']$/g, ""));

    if (values.every((v) => !v)) continue;

    const row: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });

    // Check for preferred slot
    const slotColumn = headers.findIndex((h) =>
      ["preferred_slot", "preferredslot", "slot", "time_preference"].includes(
        h.toLowerCase().replace(/[_\s]/g, ""),
      ),
    );
    if (slotColumn >= 0 && row[Object.keys(row)[slotColumn]]) {
      const slotValue = String(row[Object.keys(row)[slotColumn]]).toUpperCase();
      if (["MORNING", "AFTERNOON", "EVENING", "ANY"].includes(slotValue)) {
        preferredSlot = slotValue;
      }
    }

    // Check for course codes
    const courseColumn = headers.findIndex((h) =>
      [
        "course_codes",
        "coursecodes",
        "courses",
        "eligible_courses",
        "course_ids",
      ].includes(h.toLowerCase().replace(/[_\s]/g, "")),
    );
    if (courseColumn >= 0 && row[Object.keys(row)[courseColumn]]) {
      const courses = String(row[Object.keys(row)[courseColumn]])
        .split(/[,;]/)
        .map((c) => c.trim())
        .filter(Boolean);
      courseCodes.push(...courses);
    }

    const day = parseAvailabilityRow(row, headers);
    if (day) {
      days.push(day);
    }
  }

  return { days, preferredSlot, courseCodes };
}

function parseAvailabilityExcel(buffer: Buffer): ParsedAvailability {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file must have at least one sheet");
  }

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (data.length === 0) {
    throw new Error("Excel sheet is empty");
  }

  const headers = Object.keys(data[0] || {});
  const days: ParsedAvailabilityDay[] = [];
  let preferredSlot: string | undefined;
  let courseCodes: string[] = [];

  for (const row of data) {
    // Check for preferred slot
    const slotKey = Object.keys(row).find((k) =>
      ["preferred_slot", "preferredslot", "slot", "time_preference"].includes(
        k.toLowerCase().replace(/[_\s]/g, ""),
      ),
    );
    if (slotKey && row[slotKey]) {
      const slotValue = String(row[slotKey]).toUpperCase();
      if (["MORNING", "AFTERNOON", "EVENING", "ANY"].includes(slotValue)) {
        preferredSlot = slotValue;
      }
    }

    // Check for course codes
    const courseKey = Object.keys(row).find((k) =>
      [
        "course_codes",
        "coursecodes",
        "courses",
        "eligible_courses",
        "course_ids",
      ].includes(k.toLowerCase().replace(/[_\s]/g, "")),
    );
    if (courseKey && row[courseKey]) {
      const courses = String(row[courseKey])
        .split(/[,;]/)
        .map((c) => c.trim())
        .filter(Boolean);
      courseCodes.push(...courses);
    }

    const day = parseAvailabilityRow(row, headers);
    if (day) {
      days.push(day);
    }
  }

  return { days, preferredSlot, courseCodes };
}

export async function parseAvailabilityFile(
  buffer: Buffer,
  filename: string,
): Promise<AvailabilityParseResult> {
  const ext = filename.toLowerCase().split(".").pop();
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!["csv", "xlsx"].includes(ext || "")) {
    return {
      success: false,
      filename,
      daysParsed: 0,
      coursesFound: [],
      warnings: [],
      errors: ["Only CSV and XLSX files are supported for availability"],
    };
  }

  try {
    let parsed: ParsedAvailability;

    if (ext === "csv") {
      parsed = parseAvailabilityCSV(buffer);
    } else {
      parsed = parseAvailabilityExcel(buffer);
    }

    if (parsed.days.length === 0) {
      return {
        success: false,
        filename,
        daysParsed: 0,
        coursesFound: [],
        warnings: [],
        errors: ["No valid availability entries found in file"],
      };
    }

    // Validate days
    const validDays = parsed.days.filter((d) =>
      [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ].includes(d.dayOfWeek),
    );

    if (validDays.length === 0) {
      warnings.push("No valid day names found. Please use MONDAY-SUNDAY.");
    }

    // Deduplicate course codes
    const uniqueCourses = [...new Set(parsed.courseCodes)];

    return {
      success: true,
      filename,
      daysParsed: validDays.length,
      coursesFound: uniqueCourses,
      warnings,
      errors: [],
      preview: {
        days: validDays,
        preferredSlot: parsed.preferredSlot,
        courseCodes: uniqueCourses,
      },
    };
  } catch (error) {
    return {
      success: false,
      filename,
      daysParsed: 0,
      coursesFound: [],
      warnings: [],
      errors: [
        error instanceof Error
          ? error.message
          : "Failed to parse availability file",
      ],
    };
  }
}
