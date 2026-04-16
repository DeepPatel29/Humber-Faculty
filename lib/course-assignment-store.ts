import { getSql } from "@/lib/db";

export type CourseAssignmentStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface CourseAssignmentRow {
  id: string;
  faculty_id: string;
  faculty_name: string;
  faculty_email: string;
  request_title: string | null;
  course_id: number;
  course_code: string;
  course_name: string;
  term_label: string | null;
  academic_year: string | null;
  semester: number | null;
  section: string | null;
  program: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  room_id: string | null;
  room_label: string | null;
  class_type: string | null;
  status: CourseAssignmentStatus;
  faculty_schedule_id: string | null;
  assigned_by: string;
  assigned_at: string;
  responded_at: string | null;
  response_note: string | null;
}

export async function ensureCourseAssignmentTable(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS "faculty_schema"."faculty_course_assignments" (
      id TEXT PRIMARY KEY,
      faculty_id TEXT NOT NULL,
      request_title TEXT NULL,
      course_id INT NOT NULL,
      term_label TEXT NULL,
      academic_year TEXT NULL,
      semester INT NULL,
      section TEXT NULL,
      program TEXT NULL,
      day_of_week TEXT NULL,
      start_time TEXT NULL,
      end_time TEXT NULL,
      room_id TEXT NULL,
      room_label TEXT NULL,
      class_type TEXT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      faculty_schedule_id TEXT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      responded_at TIMESTAMPTZ NULL,
      response_note TEXT NULL
    );
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS day_of_week TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS start_time TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS end_time TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS room_id TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS room_label TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS class_type TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS request_title TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS term_label TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS academic_year TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS semester INT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS section TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS program TEXT NULL;
  `;
  await sql`
    ALTER TABLE "faculty_schema"."faculty_course_assignments"
    ADD COLUMN IF NOT EXISTS faculty_schedule_id TEXT NULL;
  `;
}
