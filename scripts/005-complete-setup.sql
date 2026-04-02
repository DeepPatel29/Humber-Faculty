-- Complete Database Setup Script
-- Drops all existing tables and recreates everything with seed data

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS faculty_requests CASCADE;
DROP TABLE IF EXISTS faculty_availability CASCADE;
DROP TABLE IF EXISTS faculty_schedules CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;
DROP TYPE IF EXISTS request_type CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'staff');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE request_type AS ENUM ('leave', 'swap', 'reschedule', 'room_change', 'other');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'request', 'schedule');

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'faculty',
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  credits INTEGER DEFAULT 3,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  building VARCHAR(255),
  capacity INTEGER DEFAULT 30,
  has_projector BOOLEAN DEFAULT TRUE,
  has_whiteboard BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty table
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(255),
  phone VARCHAR(50),
  office_location VARCHAR(255),
  bio TEXT,
  specializations TEXT[],
  qualifications TEXT[],
  publications TEXT[],
  social_links JSONB DEFAULT '{}',
  join_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty schedules table
CREATE TABLE faculty_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  semester VARCHAR(50),
  academic_year VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty availability table
CREATE TABLE faculty_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty requests table
CREATE TABLE faculty_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  request_type request_type NOT NULL,
  status request_status DEFAULT 'pending',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  target_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  target_schedule_id UUID REFERENCES faculty_schedules(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_faculty_user_id ON faculty(user_id);
CREATE INDEX idx_faculty_department_id ON faculty(department_id);
CREATE INDEX idx_faculty_schedules_faculty_id ON faculty_schedules(faculty_id);
CREATE INDEX idx_faculty_schedules_day ON faculty_schedules(day_of_week);
CREATE INDEX idx_faculty_availability_faculty_id ON faculty_availability(faculty_id);
CREATE INDEX idx_faculty_requests_faculty_id ON faculty_requests(faculty_id);
CREATE INDEX idx_faculty_requests_status ON faculty_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================
-- SEED DATA
-- =====================

-- Insert departments
INSERT INTO departments (id, name, code, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Computer Science', 'CS', 'Department of Computer Science and Engineering'),
  ('22222222-2222-2222-2222-222222222222', 'Mathematics', 'MATH', 'Department of Mathematics'),
  ('33333333-3333-3333-3333-333333333333', 'Physics', 'PHY', 'Department of Physics');

-- Insert users (password is 'password123' hashed - for demo only)
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'john.smith@university.edu', '$2b$10$demo_hash_placeholder', 'Dr. John Smith', 'faculty'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sarah.johnson@university.edu', '$2b$10$demo_hash_placeholder', 'Prof. Sarah Johnson', 'faculty'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@university.edu', '$2b$10$demo_hash_placeholder', 'Admin User', 'admin');

-- Insert courses
INSERT INTO courses (id, name, code, credits, department_id) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Introduction to Programming', 'CS101', 3, '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Data Structures', 'CS201', 4, '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Algorithms', 'CS301', 4, '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000001', 'Calculus I', 'MATH101', 3, '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000002', 'Linear Algebra', 'MATH201', 3, '22222222-2222-2222-2222-222222222222');

-- Insert rooms
INSERT INTO rooms (id, name, building, capacity, has_projector, has_whiteboard) VALUES
  ('11110000-1111-1111-1111-111111111111', 'Room 101', 'Main Building', 40, true, true),
  ('22220000-2222-2222-2222-222222222222', 'Room 102', 'Main Building', 35, true, true),
  ('33330000-3333-3333-3333-333333333333', 'Lab A', 'Science Building', 25, true, false),
  ('44440000-4444-4444-4444-444444444444', 'Lecture Hall 1', 'Main Building', 100, true, true);

-- Insert faculty
INSERT INTO faculty (id, user_id, employee_id, department_id, designation, phone, office_location, bio, specializations, qualifications) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP001', '11111111-1111-1111-1111-111111111111', 
   'Associate Professor', '+1-555-0101', 'Room 301, CS Building', 
   'Dr. John Smith is an expert in artificial intelligence and machine learning with over 15 years of experience.',
   ARRAY['Artificial Intelligence', 'Machine Learning', 'Data Science'],
   ARRAY['Ph.D. in Computer Science, MIT', 'M.S. in Computer Science, Stanford']),
  ('f2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EMP002', '22222222-2222-2222-2222-222222222222',
   'Professor', '+1-555-0102', 'Room 205, Math Building',
   'Prof. Sarah Johnson specializes in applied mathematics and numerical analysis.',
   ARRAY['Applied Mathematics', 'Numerical Analysis', 'Statistics'],
   ARRAY['Ph.D. in Mathematics, Princeton', 'M.S. in Applied Math, UCLA']);

-- Insert faculty schedules
INSERT INTO faculty_schedules (faculty_id, course_id, room_id, day_of_week, start_time, end_time, semester, academic_year, is_active) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11110000-1111-1111-1111-111111111111', 'monday', '09:00', '10:30', 'Fall', '2024-25', true),
  ('f1111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22220000-2222-2222-2222-222222222222', 'monday', '14:00', '15:30', 'Fall', '2024-25', true),
  ('f1111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11110000-1111-1111-1111-111111111111', 'wednesday', '09:00', '10:30', 'Fall', '2024-25', true),
  ('f1111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33330000-3333-3333-3333-333333333333', 'friday', '11:00', '12:30', 'Fall', '2024-25', true),
  ('f2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '44440000-4444-4444-4444-444444444444', 'tuesday', '10:00', '11:30', 'Fall', '2024-25', true),
  ('f2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '22220000-2222-2222-2222-222222222222', 'thursday', '14:00', '15:30', 'Fall', '2024-25', true);

-- Insert faculty availability
INSERT INTO faculty_availability (faculty_id, day_of_week, start_time, end_time, is_preferred) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'monday', '08:00', '17:00', true),
  ('f1111111-1111-1111-1111-111111111111', 'tuesday', '08:00', '12:00', false),
  ('f1111111-1111-1111-1111-111111111111', 'wednesday', '08:00', '17:00', true),
  ('f1111111-1111-1111-1111-111111111111', 'thursday', '10:00', '16:00', false),
  ('f1111111-1111-1111-1111-111111111111', 'friday', '08:00', '15:00', true),
  ('f2222222-2222-2222-2222-222222222222', 'monday', '09:00', '17:00', false),
  ('f2222222-2222-2222-2222-222222222222', 'tuesday', '08:00', '17:00', true),
  ('f2222222-2222-2222-2222-222222222222', 'wednesday', '08:00', '17:00', true),
  ('f2222222-2222-2222-2222-222222222222', 'thursday', '08:00', '17:00', true),
  ('f2222222-2222-2222-2222-222222222222', 'friday', '08:00', '12:00', false);

-- Insert sample requests
INSERT INTO faculty_requests (faculty_id, request_type, status, title, description, start_date, end_date) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'leave', 'pending', 'Conference Attendance', 'Attending AI Conference in San Francisco', '2024-04-15', '2024-04-18'),
  ('f1111111-1111-1111-1111-111111111111', 'swap', 'approved', 'Class Swap Request', 'Need to swap Monday class with Prof. Johnson', '2024-03-25', '2024-03-25'),
  ('f2222222-2222-2222-2222-222222222222', 'reschedule', 'pending', 'Reschedule Tuesday Class', 'Department meeting conflict', '2024-03-26', '2024-03-26');

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'info', 'Welcome to FacultyHub', 'Your account has been set up successfully. Explore your dashboard to get started.', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'success', 'Class Swap Approved', 'Your class swap request for March 25th has been approved.', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'schedule', 'Schedule Update', 'Your Monday 9:00 AM class has been moved to Room 102.', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'info', 'Welcome to FacultyHub', 'Your account has been set up successfully.', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'warning', 'Pending Request', 'You have a pending reschedule request awaiting review.', false);
