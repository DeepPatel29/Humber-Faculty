-- ============================================================================
-- Seed Data for Faculty Dashboard
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE faculty_notifications CASCADE;
TRUNCATE TABLE faculty_request_timeline CASCADE;
TRUNCATE TABLE faculty_requests CASCADE;
TRUNCATE TABLE faculty_availability_days CASCADE;
TRUNCATE TABLE faculty_availability CASCADE;
TRUNCATE TABLE faculty_schedules CASCADE;
TRUNCATE TABLE faculty_profiles CASCADE;
TRUNCATE TABLE faculty CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE departments CASCADE;

-- ============================================================================
-- Departments
-- ============================================================================

INSERT INTO departments (id, name, code, description) VALUES
  ('dept-001', 'Computer Science', 'CS', 'Department of Computer Science and Engineering'),
  ('dept-002', 'Mathematics', 'MATH', 'Department of Mathematics and Statistics'),
  ('dept-003', 'Physics', 'PHY', 'Department of Physics'),
  ('dept-004', 'Electrical Engineering', 'EE', 'Department of Electrical and Electronics Engineering');

-- ============================================================================
-- Rooms
-- ============================================================================

INSERT INTO rooms (id, name, building, floor, capacity, type) VALUES
  ('room-001', 'Room 101', 'Main Building', 1, 60, 'lecture_hall'),
  ('room-002', 'Room 102', 'Main Building', 1, 40, 'classroom'),
  ('room-003', 'Room 201', 'Main Building', 2, 30, 'classroom'),
  ('room-004', 'Lab 301', 'Science Block', 3, 25, 'lab'),
  ('room-005', 'Lab 302', 'Science Block', 3, 25, 'lab'),
  ('room-006', 'Seminar Hall', 'Conference Center', 1, 100, 'seminar'),
  ('room-007', 'Room 401', 'Engineering Block', 4, 35, 'classroom'),
  ('room-008', 'Computer Lab', 'IT Building', 2, 50, 'lab');

-- ============================================================================
-- Courses
-- ============================================================================

INSERT INTO courses (id, name, code, description, credits, department_id) VALUES
  ('course-001', 'Introduction to Programming', 'CS101', 'Fundamentals of programming using Python', 3, 'dept-001'),
  ('course-002', 'Data Structures', 'CS201', 'Advanced data structures and algorithms', 4, 'dept-001'),
  ('course-003', 'Database Systems', 'CS301', 'Relational database design and SQL', 3, 'dept-001'),
  ('course-004', 'Web Development', 'CS302', 'Modern web development with React and Node.js', 3, 'dept-001'),
  ('course-005', 'Machine Learning', 'CS401', 'Introduction to machine learning algorithms', 4, 'dept-001'),
  ('course-006', 'Calculus I', 'MATH101', 'Differential and integral calculus', 4, 'dept-002'),
  ('course-007', 'Linear Algebra', 'MATH201', 'Vector spaces and linear transformations', 3, 'dept-002'),
  ('course-008', 'Physics I', 'PHY101', 'Classical mechanics and thermodynamics', 4, 'dept-003'),
  ('course-009', 'Circuit Theory', 'EE101', 'Basic electrical circuits and analysis', 3, 'dept-004'),
  ('course-010', 'Digital Electronics', 'EE201', 'Digital logic design and microprocessors', 4, 'dept-004');

-- ============================================================================
-- Users (password hash is for 'password123' using PBKDF2)
-- ============================================================================

INSERT INTO users (id, email, password_hash, name, role, avatar_url) VALUES
  ('user-001', 'john.smith@university.edu', 'pbkdf2:100000:salt123:hashedvalue', 'Dr. John Smith', 'FACULTY', NULL),
  ('user-002', 'sarah.johnson@university.edu', 'pbkdf2:100000:salt124:hashedvalue', 'Prof. Sarah Johnson', 'FACULTY', NULL),
  ('user-003', 'michael.chen@university.edu', 'pbkdf2:100000:salt125:hashedvalue', 'Dr. Michael Chen', 'FACULTY', NULL),
  ('user-004', 'emily.davis@university.edu', 'pbkdf2:100000:salt126:hashedvalue', 'Dr. Emily Davis', 'FACULTY', NULL),
  ('user-005', 'admin@university.edu', 'pbkdf2:100000:salt127:hashedvalue', 'Admin User', 'ADMIN', NULL);

-- ============================================================================
-- Faculty
-- ============================================================================

INSERT INTO faculty (id, user_id, department_id, employee_id, designation, joining_date) VALUES
  ('faculty-001', 'user-001', 'dept-001', 'EMP001', 'Associate Professor', '2018-08-15'),
  ('faculty-002', 'user-002', 'dept-001', 'EMP002', 'Professor', '2015-01-10'),
  ('faculty-003', 'user-003', 'dept-002', 'EMP003', 'Assistant Professor', '2020-06-01'),
  ('faculty-004', 'user-004', 'dept-003', 'EMP004', 'Associate Professor', '2017-03-20');

-- ============================================================================
-- Faculty Profiles
-- ============================================================================

INSERT INTO faculty_profiles (id, faculty_id, bio, phone, office_location, office_hours, research_interests, qualifications, publications, social_links) VALUES
  ('profile-001', 'faculty-001', 'Passionate educator with 10+ years of experience in computer science. Research focus on machine learning and data systems.', '+1-555-0101', 'Room 305, CS Building', 'Mon-Wed 2:00 PM - 4:00 PM', 
   ARRAY['Machine Learning', 'Data Mining', 'Distributed Systems'],
   ARRAY['Ph.D. Computer Science, MIT (2015)', 'M.S. Computer Science, Stanford (2012)', 'B.S. Computer Science, UC Berkeley (2010)'],
   ARRAY['Smith, J. et al. (2023) "Deep Learning for Time Series Analysis"', 'Smith, J. (2022) "Scalable Machine Learning Systems"'],
   '{"linkedin": "https://linkedin.com/in/johnsmith", "github": "https://github.com/johnsmith", "website": "https://johnsmith.dev"}'::jsonb),
  
  ('profile-002', 'faculty-002', 'Leading researcher in artificial intelligence and neural networks with numerous publications.', '+1-555-0102', 'Room 401, CS Building', 'Tue-Thu 10:00 AM - 12:00 PM',
   ARRAY['Artificial Intelligence', 'Neural Networks', 'Computer Vision'],
   ARRAY['Ph.D. Computer Science, Stanford (2010)', 'M.S. Computer Science, MIT (2007)'],
   ARRAY['Johnson, S. (2024) "Advances in Neural Architecture"', 'Johnson, S. et al. (2023) "Vision Transformers: A Survey"'],
   '{"linkedin": "https://linkedin.com/in/sarahjohnson", "twitter": "https://twitter.com/sarahjohnson"}'::jsonb),
  
  ('profile-003', 'faculty-003', 'Mathematics educator focusing on applied mathematics and computational methods.', '+1-555-0103', 'Room 202, Math Building', 'Mon-Fri 1:00 PM - 2:00 PM',
   ARRAY['Applied Mathematics', 'Numerical Analysis', 'Optimization'],
   ARRAY['Ph.D. Mathematics, Princeton (2019)', 'M.S. Applied Mathematics, Columbia (2016)'],
   ARRAY['Chen, M. (2024) "Optimization Methods for Large-Scale Systems"'],
   '{"linkedin": "https://linkedin.com/in/michaelchen"}'::jsonb),
  
  ('profile-004', 'faculty-004', 'Physicist specializing in quantum mechanics and theoretical physics.', '+1-555-0104', 'Room 110, Physics Building', 'Wed-Fri 3:00 PM - 5:00 PM',
   ARRAY['Quantum Mechanics', 'Theoretical Physics', 'Condensed Matter'],
   ARRAY['Ph.D. Physics, Caltech (2014)', 'M.S. Physics, Harvard (2011)'],
   ARRAY['Davis, E. et al. (2023) "Quantum Computing Applications"', 'Davis, E. (2022) "Condensed Matter Physics: New Frontiers"'],
   '{"website": "https://emilydavis.physics.edu"}'::jsonb);

-- ============================================================================
-- Faculty Schedules (for faculty-001 - Dr. John Smith)
-- ============================================================================

INSERT INTO faculty_schedules (id, faculty_id, course_id, room_id, day_of_week, start_time, end_time, type, section, program, semester, academic_year, is_active) VALUES
  -- Monday
  ('schedule-001', 'faculty-001', 'course-001', 'room-001', 'MONDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 1, '2024-25', TRUE),
  ('schedule-002', 'faculty-001', 'course-002', 'room-002', 'MONDAY', '11:00', '12:30', 'LECTURE', 'A', 'B.Tech', 3, '2024-25', TRUE),
  ('schedule-003', 'faculty-001', 'course-004', 'room-008', 'MONDAY', '14:00', '15:30', 'LAB', 'A', 'B.Tech', 5, '2024-25', TRUE),
  -- Tuesday
  ('schedule-004', 'faculty-001', 'course-003', 'room-003', 'TUESDAY', '09:00', '10:30', 'LECTURE', 'B', 'B.Tech', 5, '2024-25', TRUE),
  ('schedule-005', 'faculty-001', 'course-005', 'room-001', 'TUESDAY', '11:00', '12:30', 'LECTURE', 'A', 'M.Tech', 1, '2024-25', TRUE),
  -- Wednesday
  ('schedule-006', 'faculty-001', 'course-001', 'room-001', 'WEDNESDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 1, '2024-25', TRUE),
  ('schedule-007', 'faculty-001', 'course-002', 'room-004', 'WEDNESDAY', '14:00', '16:00', 'LAB', 'A', 'B.Tech', 3, '2024-25', TRUE),
  -- Thursday
  ('schedule-008', 'faculty-001', 'course-003', 'room-003', 'THURSDAY', '09:00', '10:30', 'LECTURE', 'B', 'B.Tech', 5, '2024-25', TRUE),
  ('schedule-009', 'faculty-001', 'course-004', 'room-002', 'THURSDAY', '11:00', '12:30', 'LECTURE', 'A', 'B.Tech', 5, '2024-25', TRUE),
  ('schedule-010', 'faculty-001', 'course-005', 'room-005', 'THURSDAY', '14:00', '16:00', 'LAB', 'A', 'M.Tech', 1, '2024-25', TRUE),
  -- Friday
  ('schedule-011', 'faculty-001', 'course-001', 'room-008', 'FRIDAY', '09:00', '11:00', 'LAB', 'A', 'B.Tech', 1, '2024-25', TRUE),
  ('schedule-012', 'faculty-001', 'course-002', 'room-002', 'FRIDAY', '11:00', '12:30', 'TUTORIAL', 'A', 'B.Tech', 3, '2024-25', TRUE);

-- Schedules for other faculty members
INSERT INTO faculty_schedules (id, faculty_id, course_id, room_id, day_of_week, start_time, end_time, type, section, program, semester, academic_year, is_active) VALUES
  ('schedule-101', 'faculty-002', 'course-005', 'room-001', 'MONDAY', '09:00', '10:30', 'LECTURE', 'B', 'M.Tech', 1, '2024-25', TRUE),
  ('schedule-102', 'faculty-002', 'course-004', 'room-002', 'TUESDAY', '14:00', '15:30', 'LECTURE', 'B', 'B.Tech', 5, '2024-25', TRUE),
  ('schedule-103', 'faculty-003', 'course-006', 'room-003', 'MONDAY', '11:00', '12:30', 'LECTURE', 'A', 'B.Tech', 1, '2024-25', TRUE),
  ('schedule-104', 'faculty-003', 'course-007', 'room-003', 'WEDNESDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 3, '2024-25', TRUE),
  ('schedule-105', 'faculty-004', 'course-008', 'room-001', 'TUESDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 1, '2024-25', TRUE);

-- ============================================================================
-- Faculty Availability
-- ============================================================================

INSERT INTO faculty_availability (id, faculty_id, preferred_slot, custom_start_time, custom_end_time, notes) VALUES
  ('avail-001', 'faculty-001', 'MORNING', '08:00', '14:00', 'Prefer morning classes. Available for meetings in the afternoon.'),
  ('avail-002', 'faculty-002', 'ANY', NULL, NULL, 'Flexible schedule, available most days.'),
  ('avail-003', 'faculty-003', 'AFTERNOON', '12:00', '18:00', 'Research work in mornings, prefer afternoon teaching.'),
  ('avail-004', 'faculty-004', 'MORNING', '09:00', '13:00', 'Lab work in afternoons.');

INSERT INTO faculty_availability_days (id, availability_id, day_of_week, is_available) VALUES
  ('avail-day-001', 'avail-001', 'MONDAY', TRUE),
  ('avail-day-002', 'avail-001', 'TUESDAY', TRUE),
  ('avail-day-003', 'avail-001', 'WEDNESDAY', TRUE),
  ('avail-day-004', 'avail-001', 'THURSDAY', TRUE),
  ('avail-day-005', 'avail-001', 'FRIDAY', TRUE),
  ('avail-day-006', 'avail-001', 'SATURDAY', FALSE),
  ('avail-day-007', 'avail-001', 'SUNDAY', FALSE);

-- ============================================================================
-- Faculty Requests
-- ============================================================================

INSERT INTO faculty_requests (id, faculty_id, type, status, title, description, effective_date, end_date, target_faculty_id, target_schedule_id, reason, created_at) VALUES
  ('request-001', 'faculty-001', 'SWAP', 'PENDING', 'Class Swap Request - CS101', 'Request to swap Monday CS101 class with Prof. Sarah Johnson', '2025-04-01', NULL, 'faculty-002', 'schedule-001', 'Attending a conference on Monday morning', NOW() - INTERVAL '2 days'),
  ('request-002', 'faculty-001', 'RESCHEDULE', 'APPROVED', 'Reschedule Database Systems Lab', 'Move Thursday lab to Friday afternoon', '2025-03-28', NULL, NULL, 'schedule-010', 'Department meeting scheduled on Thursday', NOW() - INTERVAL '5 days'),
  ('request-003', 'faculty-001', 'LEAVE', 'PENDING', 'Medical Leave Request', 'Personal medical appointment', '2025-04-05', '2025-04-05', NULL, NULL, 'Scheduled medical checkup', NOW() - INTERVAL '1 day'),
  ('request-004', 'faculty-001', 'SWAP', 'REJECTED', 'Class Swap - Data Structures', 'Swap with Dr. Chen', '2025-03-15', NULL, 'faculty-003', 'schedule-002', 'Family event', NOW() - INTERVAL '10 days');

INSERT INTO faculty_request_timeline (id, request_id, status, comment, created_by, created_at) VALUES
  ('timeline-001', 'request-001', 'PENDING', 'Request submitted for review', 'Dr. John Smith', NOW() - INTERVAL '2 days'),
  ('timeline-002', 'request-002', 'PENDING', 'Request submitted', 'Dr. John Smith', NOW() - INTERVAL '5 days'),
  ('timeline-003', 'request-002', 'APPROVED', 'Approved by HOD. Lab moved to Friday 2:00 PM', 'Dr. Admin', NOW() - INTERVAL '3 days'),
  ('timeline-004', 'request-003', 'PENDING', 'Leave request submitted', 'Dr. John Smith', NOW() - INTERVAL '1 day'),
  ('timeline-005', 'request-004', 'PENDING', 'Request submitted', 'Dr. John Smith', NOW() - INTERVAL '10 days'),
  ('timeline-006', 'request-004', 'REJECTED', 'Dr. Chen unavailable on that day', 'Scheduler', NOW() - INTERVAL '8 days');

-- ============================================================================
-- Faculty Notifications
-- ============================================================================

INSERT INTO faculty_notifications (id, faculty_id, type, title, message, is_read, link, created_at) VALUES
  ('notif-001', 'faculty-001', 'REQUEST_UPDATE', 'Reschedule Request Approved', 'Your reschedule request for Database Systems Lab has been approved. The class has been moved to Friday 2:00 PM.', TRUE, '/faculty/requests/request-002', NOW() - INTERVAL '3 days'),
  ('notif-002', 'faculty-001', 'SCHEDULE_CHANGE', 'Timetable Updated', 'Your timetable has been updated. Please review the changes in your schedule.', FALSE, '/faculty/timetable', NOW() - INTERVAL '2 days'),
  ('notif-003', 'faculty-001', 'ANNOUNCEMENT', 'Faculty Meeting Scheduled', 'A faculty meeting has been scheduled for March 30th at 3:00 PM in the Conference Room.', FALSE, NULL, NOW() - INTERVAL '1 day'),
  ('notif-004', 'faculty-001', 'REMINDER', 'Upcoming Class Reminder', 'You have Introduction to Programming (CS101) tomorrow at 9:00 AM in Room 101.', FALSE, '/faculty/timetable', NOW() - INTERVAL '6 hours'),
  ('notif-005', 'faculty-001', 'SYSTEM', 'Profile Update Required', 'Please update your faculty profile with your latest publications and research interests.', FALSE, '/faculty/profile', NOW() - INTERVAL '12 hours'),
  ('notif-006', 'faculty-001', 'REQUEST_UPDATE', 'Swap Request Under Review', 'Your swap request for CS101 with Prof. Sarah Johnson is being reviewed by the scheduler.', FALSE, '/faculty/requests/request-001', NOW() - INTERVAL '1 day');
