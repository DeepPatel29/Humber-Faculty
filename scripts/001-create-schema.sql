-- ============================================================================
-- Faculty Dashboard Database Schema
-- Compatible with Prisma schema for PostgreSQL (Neon)
-- ============================================================================

-- Drop existing types if they exist (for clean re-runs)
DROP TYPE IF EXISTS "AppRole" CASCADE;
DROP TYPE IF EXISTS "RequestType" CASCADE;
DROP TYPE IF EXISTS "RequestStatus" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;
DROP TYPE IF EXISTS "ScheduleItemType" CASCADE;
DROP TYPE IF EXISTS "PreferredSlot" CASCADE;
DROP TYPE IF EXISTS "DayOfWeek" CASCADE;

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE "AppRole" AS ENUM ('ADMIN', 'FACULTY', 'STUDENT', 'SCHEDULER');
CREATE TYPE "RequestType" AS ENUM ('SWAP', 'RESCHEDULE', 'LEAVE');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_UPDATE', 'SCHEDULE_CHANGE', 'ANNOUNCEMENT', 'REMINDER', 'SYSTEM');
CREATE TYPE "ScheduleItemType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL', 'SEMINAR', 'OFFICE_HOURS');
CREATE TYPE "PreferredSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'ANY');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role "AppRole" DEFAULT 'FACULTY',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  credits INT DEFAULT 3,
  department_id UUID NOT NULL REFERENCES departments(id)
);

CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  building VARCHAR(100) NOT NULL,
  floor INT DEFAULT 1,
  capacity INT DEFAULT 30,
  type VARCHAR(50) DEFAULT 'classroom'
);

-- ============================================================================
-- Faculty Tables
-- ============================================================================

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  designation VARCHAR(100) NOT NULL,
  joining_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id);

-- Faculty profiles table
CREATE TABLE IF NOT EXISTS faculty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID UNIQUE NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  bio TEXT,
  phone VARCHAR(50),
  office_location VARCHAR(255),
  office_hours VARCHAR(255),
  research_interests TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  publications TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}'
);

-- Faculty schedules table
CREATE TABLE IF NOT EXISTS faculty_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  day_of_week "DayOfWeek" NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  type "ScheduleItemType" DEFAULT 'LECTURE',
  section VARCHAR(50),
  program VARCHAR(100),
  semester INT,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_faculty_day ON faculty_schedules(faculty_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_faculty_active ON faculty_schedules(faculty_id, is_active);

-- Faculty availability table
CREATE TABLE IF NOT EXISTS faculty_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID UNIQUE NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  preferred_slot "PreferredSlot" DEFAULT 'ANY',
  custom_start_time VARCHAR(10),
  custom_end_time VARCHAR(10),
  unavailable_start VARCHAR(10),
  unavailable_end VARCHAR(10),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Faculty availability days table
CREATE TABLE IF NOT EXISTS faculty_availability_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_id UUID NOT NULL REFERENCES faculty_availability(id) ON DELETE CASCADE,
  day_of_week "DayOfWeek" NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(availability_id, day_of_week)
);

-- ============================================================================
-- Request Tables
-- ============================================================================

-- Faculty requests table
CREATE TABLE IF NOT EXISTS faculty_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  type "RequestType" NOT NULL,
  status "RequestStatus" DEFAULT 'PENDING',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  request_date TIMESTAMP DEFAULT NOW(),
  effective_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  target_faculty_id UUID REFERENCES faculty(id),
  target_schedule_id UUID REFERENCES faculty_schedules(id),
  new_date TIMESTAMP,
  new_start_time VARCHAR(10),
  new_end_time VARCHAR(10),
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_faculty_status ON faculty_requests(faculty_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_faculty_created ON faculty_requests(faculty_id, created_at DESC);

-- Faculty request timeline table
CREATE TABLE IF NOT EXISTS faculty_request_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES faculty_requests(id) ON DELETE CASCADE,
  status "RequestStatus" NOT NULL,
  comment TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_request ON faculty_request_timeline(request_id);

-- ============================================================================
-- Notification Tables
-- ============================================================================

-- Faculty notifications table
CREATE TABLE IF NOT EXISTS faculty_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  type "NotificationType" NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_faculty_read ON faculty_notifications(faculty_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_faculty_created ON faculty_notifications(faculty_id, created_at DESC);
