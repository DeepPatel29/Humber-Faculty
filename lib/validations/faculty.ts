import { z } from "zod";
import {
  PreferredSlot,
  DayOfWeek,
  RequestStatus,
  FacultyStatus,
} from "@/lib/types/faculty";

// ============================================================================
// Common Schemas
// ============================================================================

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)");

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");

export const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================================================
// Profile Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email("Invalid email address").optional(),
  departmentId: uuidSchema.optional(),
  bio: z.string().max(1000, "Bio must be 1000 characters or less").nullable().optional(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-()]+$/, "Invalid phone number format")
    .nullable()
    .optional(),
  officeLocation: z.string().max(200).nullable().optional(),
  officeHours: z.string().max(500).nullable().optional(),
  researchInterests: z.array(z.string().max(100)).max(20).optional(),
  qualifications: z.array(z.string().max(200)).max(10).optional(),
  publications: z.array(z.string().max(500)).max(50).optional(),
  socialLinks: z.record(z.string(), z.string().url("Invalid URL")).optional(),
  designation: z.string().min(1).max(200).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// Availability Schemas
// ============================================================================

const optionalDayTimeSchema = z
  .union([timeStringSchema, z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

export const availabilityDaySchema = z
  .object({
    dayOfWeek: z.nativeEnum(DayOfWeek),
    isAvailable: z.boolean(),
    startTime: optionalDayTimeSchema,
    endTime: optionalDayTimeSchema,
  })
  .superRefine((day, ctx) => {
    if (day.isAvailable) {
      if (!day.startTime || !day.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "When available, provide start and end time for this day",
          path: ["startTime"],
        });
      } else if (day.startTime >= day.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time must be before end time",
          path: ["endTime"],
        });
      }
    }
  });

export const updateAvailabilitySchema = z
  .object({
    preferredSlot: z.nativeEnum(PreferredSlot),
    customStartTime: timeStringSchema.nullable().optional(),
    customEndTime: timeStringSchema.nullable().optional(),
    unavailableStart: timeStringSchema.nullable().optional(),
    unavailableEnd: timeStringSchema.nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    days: z.array(availabilityDaySchema).length(7, "Must provide all 7 days"),
  })
  .refine(
    (data) => {
      if (data.customStartTime && data.customEndTime) {
        return data.customStartTime < data.customEndTime;
      }
      return true;
    },
    { message: "Custom start time must be before end time", path: ["customEndTime"] }
  )
  .refine(
    (data) => {
      if (data.unavailableStart && data.unavailableEnd) {
        return data.unavailableStart < data.unavailableEnd;
      }
      return true;
    },
    { message: "Unavailable start must be before end", path: ["unavailableEnd"] }
  );

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

// ============================================================================
// Request Schemas
// ============================================================================

export const createSwapRequestSchema = z.object({
  targetFacultyId: uuidSchema,
  targetScheduleId: uuidSchema,
  myScheduleId: uuidSchema,
  effectiveDate: dateStringSchema,
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
});

export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;

export const createRescheduleRequestSchema = z.object({
  scheduleId: uuidSchema,
  newDate: dateStringSchema,
  newStartTime: timeStringSchema,
  newEndTime: timeStringSchema,
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
}).refine(
  (data) => data.newStartTime < data.newEndTime,
  { message: "Start time must be before end time", path: ["newEndTime"] }
);

export type CreateRescheduleRequestInput = z.infer<typeof createRescheduleRequestSchema>;

export const createLeaveRequestSchema = z.object({
  effectiveDate: dateStringSchema,
  endDate: dateStringSchema,
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
}).refine(
  (data) => data.effectiveDate <= data.endDate,
  { message: "End date must be on or after effective date", path: ["endDate"] }
);

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const updateRequestSchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  reason: z.string().min(5).max(500).optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

// ============================================================================
// Query Params Schemas
// ============================================================================

export const timetableQuerySchema = z.object({
  weekStart: dateStringSchema.optional(),
  courseCode: z.string().optional(),
  program: z.string().optional(),
  view: z.enum(["week", "day", "month"]).optional(),
});

export type TimetableQueryInput = z.infer<typeof timetableQuerySchema>;

export const requestsQuerySchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  type: z.enum(["SWAP", "RESCHEDULE", "LEAVE"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type RequestsQueryInput = z.infer<typeof requestsQuerySchema>;

export const notificationsQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type NotificationsQueryInput = z.infer<typeof notificationsQuerySchema>;

// ============================================================================
// Faculty request PATCH (detail route)
// ============================================================================

export const patchFacultyRequestByIdSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  comment: z.string().max(1000).optional(),
});

export type PatchFacultyRequestByIdInput = z.infer<typeof patchFacultyRequestByIdSchema>;

// ============================================================================
// Admin: approve / reject faculty request
// ============================================================================

export const adminPatchFacultyRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(1000).optional(),
});

export type AdminPatchFacultyRequestInput = z.infer<typeof adminPatchFacultyRequestSchema>;

// ============================================================================
// Availability PUT (partial updates supported by API)
// ============================================================================

export const updateAvailabilityBodySchema = z
  .object({
    preferredSlot: z.nativeEnum(PreferredSlot).optional(),
    customStartTime: timeStringSchema.nullable().optional(),
    customEndTime: timeStringSchema.nullable().optional(),
    unavailableStart: timeStringSchema.nullable().optional(),
    unavailableEnd: timeStringSchema.nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    days: z.array(availabilityDaySchema).optional(),
    submitAsRequest: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.customStartTime && data.customEndTime) {
        return data.customStartTime < data.customEndTime;
      }
      return true;
    },
    { message: "Custom start time must be before end time", path: ["customEndTime"] }
  )
  .refine(
    (data) => {
      if (data.unavailableStart && data.unavailableEnd) {
        return data.unavailableStart < data.unavailableEnd;
      }
      return true;
    },
    { message: "Unavailable start must be before end", path: ["unavailableEnd"] }
  );

export type UpdateAvailabilityBodyInput = z.infer<typeof updateAvailabilityBodySchema>;

// ============================================================================
// Canonical Faculty CRUD (rubric)
// ============================================================================

export const createFacultyResourceSchema = z.object({
  userId: uuidSchema,
  departmentId: uuidSchema,
  employeeId: z.string().min(1).max(64),
  designation: z.string().min(1).max(200),
  joiningDate: z.coerce.date().optional(),
});

export type CreateFacultyResourceInput = z.infer<typeof createFacultyResourceSchema>;

export const updateFacultyResourceSchema = z.object({
  departmentId: uuidSchema.optional(),
  employeeId: z.string().min(1).max(64).optional(),
  designation: z.string().min(1).max(200).optional(),
  status: z.nativeEnum(FacultyStatus).optional(),
});

export type UpdateFacultyResourceInput = z.infer<typeof updateFacultyResourceSchema>;

export const facultyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type FacultyListQueryInput = z.infer<typeof facultyListQuerySchema>;
