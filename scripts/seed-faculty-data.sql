-- ============================================================================
-- Faculty Dashboard Seed Data
-- Run this script to populate the database with sample data
-- ============================================================================

-- Clean existing data (in reverse order of dependencies)
DELETE FROM faculty_request_timeline;
DELETE FROM faculty_requests;
DELETE FROM faculty_notifications;
DELETE FROM faculty_availability_days;
DELETE FROM faculty_availability;
DELETE FROM faculty_schedules;
DELETE FROM faculty_profiles;
DELETE FROM faculty;
DELETE FROM courses;
DELETE FROM rooms;
DELETE FROM departments;
DELETE FROM sessions;
DELETE FROM accounts;
DELETE FROM users;

-- ============================================================================
-- Users
-- ============================================================================

INSERT INTO users (id, email, name, role, avatar_url, email_verified, created_at, updated_at) VALUES
('user-001', 'john.smith@university.edu', 'Dr. John Smith', 'FACULTY', NULL, true, NOW(), NOW()),
('user-002', 'jane.doe@university.edu', 'Dr. Jane Doe', 'FACULTY', NULL, true, NOW(), NOW()),
('user-003', 'robert.johnson@university.edu', 'Dr. Robert Johnson', 'FACULTY', NULL, true, NOW(), NOW()),
('user-004', 'emily.chen@university.edu', 'Dr. Emily Chen', 'FACULTY', NULL, true, NOW(), NOW()),
('user-005', 'michael.brown@university.edu', 'Dr. Michael Brown', 'FACULTY', NULL, true, NOW(), NOW()),
('admin-001', 'admin@university.edu', 'System Admin', 'ADMIN', NULL, true, NOW(), NOW());

-- ============================================================================
-- Departments
-- ============================================================================

INSERT INTO departments (id, name, code, description) VALUES
('dept-cs', 'Computer Science', 'CS', 'Department of Computer Science and Engineering'),
('dept-math', 'Mathematics', 'MATH', 'Department of Mathematics and Statistics'),
('dept-phy', 'Physics', 'PHY', 'Department of Physics');

-- ============================================================================
-- Rooms
-- ============================================================================

INSERT INTO rooms (id, name, building, floor, capacity, type) VALUES
('room-lh101', 'LH-101', 'Engineering', 1, 100, 'lecture_hall'),
('room-lh102', 'LH-102', 'Engineering', 1, 80, 'lecture_hall'),
('room-lab201', 'Lab-201', 'Engineering', 2, 40, 'computer_lab'),
('room-lab202', 'Lab-202', 'Engineering', 2, 40, 'computer_lab'),
('room-cr301', 'CR-301', 'Engineering', 3, 50, 'classroom'),
('room-cr302', 'CR-302', 'Engineering', 3, 50, 'classroom'),
('room-sem401', 'Seminar-401', 'Engineering', 4, 30, 'seminar_room');

-- ============================================================================
-- Courses
-- ============================================================================

INSERT INTO courses (id, name, code, description, credits, department_id) VALUES
('course-cs501', 'Machine Learning', 'CS501', 'Introduction to machine learning algorithms and applications', 4, 'dept-cs'),
('course-cs601', 'Deep Learning', 'CS601', 'Advanced deep learning and neural networks', 3, 'dept-cs'),
('course-cs201', 'Data Structures', 'CS201', 'Fundamental data structures and algorithms', 4, 'dept-cs'),
('course-cs301', 'Algorithms', 'CS301', 'Design and analysis of algorithms', 4, 'dept-cs'),
('course-cs401', 'Operating Systems', 'CS401', 'Operating system concepts and design', 4, 'dept-cs'),
('course-cs402', 'Database Systems', 'CS402', 'Database design and management', 3, 'dept-cs'),
('course-math101', 'Calculus I', 'MATH101', 'Single variable calculus', 4, 'dept-math'),
('course-math201', 'Linear Algebra', 'MATH201', 'Matrices and linear transformations', 3, 'dept-math');

-- ============================================================================
-- Faculty
-- ============================================================================

INSERT INTO faculty (id, user_id, department_id, employee_id, designation, joining_date) VALUES
('faculty-001', 'user-001', 'dept-cs', 'EMP-CS-001', 'Associate Professor', '2018-08-01'),
('faculty-002', 'user-002', 'dept-cs', 'EMP-CS-002', 'Professor', '2015-01-15'),
('faculty-003', 'user-003', 'dept-cs', 'EMP-CS-003', 'Assistant Professor', '2020-06-01'),
('faculty-004', 'user-004', 'dept-cs', 'EMP-CS-004', 'Associate Professor', '2017-03-01'),
('faculty-005', 'user-005', 'dept-math', 'EMP-MATH-001', 'Professor', '2012-09-01');

-- ============================================================================
-- Faculty Profiles
-- ============================================================================

INSERT INTO faculty_profiles (id, faculty_id, bio, phone, office_location, office_hours, research_interests, qualifications, publications, social_links) VALUES
('profile-001', 'faculty-001', 
 'Dr. John Smith is an Associate Professor specializing in Machine Learning and Artificial Intelligence. With over 15 years of research experience, he has published extensively in top-tier conferences and journals.',
 '+1-555-123-4567',
 'Engineering Building, Room 405',
 'Mon & Wed: 2:00 PM - 4:00 PM, Fri: 10:00 AM - 12:00 PM',
 ARRAY['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision'],
 ARRAY['Ph.D. in Computer Science, MIT (2010)', 'M.S. in Computer Science, Stanford (2006)', 'B.Tech in Computer Engineering, IIT Delhi (2004)'],
 ARRAY['Smith, J. et al. (2023). "Advances in Neural Architecture Search". NeurIPS.', 'Smith, J. & Doe, A. (2022). "Efficient Transformers for Edge Devices". ICML.'],
 '{"linkedin": "https://linkedin.com/in/drjohnsmith", "github": "https://github.com/jsmith", "googleScholar": "https://scholar.google.com/citations?user=jsmith"}'::jsonb
),
('profile-002', 'faculty-002',
 'Dr. Jane Doe is a Professor focusing on distributed systems and cloud computing. She has over 20 years of experience in academia and industry.',
 '+1-555-234-5678',
 'Engineering Building, Room 410',
 'Tue & Thu: 10:00 AM - 12:00 PM',
 ARRAY['Distributed Systems', 'Cloud Computing', 'Big Data'],
 ARRAY['Ph.D. in Computer Science, Stanford (2005)', 'M.S. in Computer Science, CMU (2001)'],
 ARRAY['Doe, J. (2024). "Scalable Distributed Systems". IEEE TPDS.'],
 '{"linkedin": "https://linkedin.com/in/drjanedoe"}'::jsonb
),
('profile-003', 'faculty-003',
 'Dr. Robert Johnson is an Assistant Professor specializing in cybersecurity and cryptography.',
 '+1-555-345-6789',
 'Engineering Building, Room 412',
 'Mon & Wed: 3:00 PM - 5:00 PM',
 ARRAY['Cybersecurity', 'Cryptography', 'Network Security'],
 ARRAY['Ph.D. in Computer Science, Berkeley (2019)', 'M.S. in Computer Science, UCLA (2015)'],
 ARRAY[]::text[],
 '{}'::jsonb
),
('profile-004', 'faculty-004',
 'Dr. Emily Chen is an Associate Professor working on human-computer interaction and software engineering.',
 '+1-555-456-7890',
 'Engineering Building, Room 415',
 'Tue & Thu: 2:00 PM - 4:00 PM',
 ARRAY['Human-Computer Interaction', 'Software Engineering', 'User Experience'],
 ARRAY['Ph.D. in HCI, Georgia Tech (2016)', 'M.S. in Computer Science, MIT (2012)'],
 ARRAY['Chen, E. (2023). "Designing for Accessibility". CHI.'],
 '{"linkedin": "https://linkedin.com/in/dremilychen"}'::jsonb
),
('profile-005', 'faculty-005',
 'Dr. Michael Brown is a Professor of Mathematics specializing in applied mathematics and numerical analysis.',
 '+1-555-567-8901',
 'Science Building, Room 301',
 'Mon, Wed, Fri: 11:00 AM - 12:00 PM',
 ARRAY['Applied Mathematics', 'Numerical Analysis', 'Mathematical Modeling'],
 ARRAY['Ph.D. in Mathematics, Princeton (2008)', 'M.S. in Mathematics, MIT (2004)'],
 ARRAY['Brown, M. (2022). "Advances in Numerical Methods". SIAM.'],
 '{}'::jsonb
);

-- ============================================================================
-- Faculty Schedules (for faculty-001 - Dr. John Smith)
-- ============================================================================

INSERT INTO faculty_schedules (id, faculty_id, course_id, room_id, day_of_week, start_time, end_time, type, section, program, semester, academic_year, is_active, created_at, updated_at) VALUES
-- Monday
('schedule-001', 'faculty-001', 'course-cs501', 'room-lh101', 'MONDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 5, '2024-25', true, NOW(), NOW()),
('schedule-002', 'faculty-001', 'course-cs601', 'room-lab201', 'MONDAY', '14:00', '15:30', 'LAB', 'A', 'M.Tech', 1, '2024-25', true, NOW(), NOW()),
-- Tuesday
('schedule-003', 'faculty-001', 'course-cs501', 'room-lh101', 'TUESDAY', '11:00', '12:30', 'LECTURE', 'B', 'B.Tech', 5, '2024-25', true, NOW(), NOW()),
-- Wednesday
('schedule-004', 'faculty-001', 'course-cs201', 'room-cr301', 'WEDNESDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 3, '2024-25', true, NOW(), NOW()),
-- Thursday
('schedule-005', 'faculty-001', 'course-cs301', 'room-sem401', 'THURSDAY', '14:00', '15:30', 'SEMINAR', NULL, 'Ph.D', NULL, '2024-25', true, NOW(), NOW()),
-- Friday
('schedule-006', 'faculty-001', 'course-cs601', 'room-lh101', 'FRIDAY', '10:00', '11:30', 'LECTURE', 'A', 'M.Tech', 1, '2024-25', true, NOW(), NOW());

-- Schedules for other faculty members
INSERT INTO faculty_schedules (id, faculty_id, course_id, room_id, day_of_week, start_time, end_time, type, section, program, semester, academic_year, is_active, created_at, updated_at) VALUES
('schedule-010', 'faculty-002', 'course-cs401', 'room-lh102', 'MONDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 5, '2024-25', true, NOW(), NOW()),
('schedule-011', 'faculty-002', 'course-cs402', 'room-lab202', 'TUESDAY', '14:00', '15:30', 'LAB', 'A', 'B.Tech', 5, '2024-25', true, NOW(), NOW()),
('schedule-012', 'faculty-003', 'course-cs201', 'room-cr302', 'WEDNESDAY', '11:00', '12:30', 'LECTURE', 'B', 'B.Tech', 3, '2024-25', true, NOW(), NOW()),
('schedule-013', 'faculty-004', 'course-cs301', 'room-lh101', 'THURSDAY', '09:00', '10:30', 'LECTURE', 'A', 'B.Tech', 4, '2024-25', true, NOW(), NOW()),
('schedule-014', 'faculty-005', 'course-math101', 'room-lh102', 'MONDAY', '11:00', '12:30', 'LECTURE', 'A', 'B.Tech', 1, '2024-25', true, NOW(), NOW()),
('schedule-015', 'faculty-005', 'course-math201', 'room-cr301', 'WEDNESDAY', '14:00', '15:30', 'LECTURE', 'A', 'B.Tech', 2, '2024-25', true, NOW(), NOW());

-- ============================================================================
-- Faculty Availability
-- ============================================================================

INSERT INTO faculty_availability (id, faculty_id, preferred_slot, custom_start_time, custom_end_time, unavailable_start, unavailable_end, notes, updated_at) VALUES
('avail-001', 'faculty-001', 'MORNING', '08:00', '16:00', '12:00', '13:00', 'Lunch break: 12:00-13:00. Research meetings on Wednesday afternoons.', NOW()),
('avail-002', 'faculty-002', 'ANY', '09:00', '17:00', '12:30', '13:30', NULL, NOW()),
('avail-003', 'faculty-003', 'AFTERNOON', '10:00', '18:00', '13:00', '14:00', 'Prefer afternoon classes.', NOW()),
('avail-004', 'faculty-004', 'MORNING', '08:30', '16:30', '12:00', '13:00', NULL, NOW()),
('avail-005', 'faculty-005', 'ANY', '09:00', '17:00', '12:00', '13:00', NULL, NOW());

-- ============================================================================
-- Faculty Availability Days
-- ============================================================================

INSERT INTO faculty_availability_days (id, availability_id, day_of_week, is_available) VALUES
-- Faculty 001
('avail-day-001-mon', 'avail-001', 'MONDAY', true),
('avail-day-001-tue', 'avail-001', 'TUESDAY', true),
('avail-day-001-wed', 'avail-001', 'WEDNESDAY', true),
('avail-day-001-thu', 'avail-001', 'THURSDAY', true),
('avail-day-001-fri', 'avail-001', 'FRIDAY', true),
('avail-day-001-sat', 'avail-001', 'SATURDAY', false),
('avail-day-001-sun', 'avail-001', 'SUNDAY', false),
-- Faculty 002
('avail-day-002-mon', 'avail-002', 'MONDAY', true),
('avail-day-002-tue', 'avail-002', 'TUESDAY', true),
('avail-day-002-wed', 'avail-002', 'WEDNESDAY', true),
('avail-day-002-thu', 'avail-002', 'THURSDAY', true),
('avail-day-002-fri', 'avail-002', 'FRIDAY', true),
('avail-day-002-sat', 'avail-002', 'SATURDAY', false),
('avail-day-002-sun', 'avail-002', 'SUNDAY', false);

-- ============================================================================
-- Faculty Requests
-- ============================================================================

INSERT INTO faculty_requests (id, faculty_id, type, status, title, description, request_date, effective_date, end_date, target_faculty_id, target_schedule_id, new_date, new_start_time, new_end_time, reason, created_at, updated_at) VALUES
('request-001', 'faculty-001', 'SWAP', 'PENDING', 
 'Swap CS501 Monday class with Dr. Jane Doe',
 'Requesting to swap Monday 9:00 AM class due to research meeting conflict.',
 NOW(), NOW() + INTERVAL '7 days', NULL,
 'faculty-002', 'schedule-010', NULL, NULL, NULL,
 'I have an important research collaboration meeting that conflicts with this time slot.',
 NOW(), NOW()),
('request-002', 'faculty-001', 'RESCHEDULE', 'APPROVED',
 'Reschedule CS601 Lab to Thursday',
 'Move Monday lab session to Thursday due to equipment maintenance.',
 NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', NULL,
 NULL, 'schedule-002', NOW() + INTERVAL '5 days', '14:00', '15:30',
 'Lab equipment scheduled for maintenance on Monday. Thursday slot is available.',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('request-003', 'faculty-001', 'LEAVE', 'REJECTED',
 'Medical Leave Request',
 'Requesting leave for medical appointment.',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days',
 NULL, NULL, NULL, NULL, NULL,
 'Medical appointment that cannot be rescheduled.',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days');

-- ============================================================================
-- Faculty Request Timeline
-- ============================================================================

INSERT INTO faculty_request_timeline (id, request_id, status, comment, created_by, created_at) VALUES
('timeline-001', 'request-001', 'PENDING', 'Request submitted', 'faculty-001', NOW()),
('timeline-002', 'request-002', 'PENDING', 'Request submitted', 'faculty-001', NOW() - INTERVAL '5 days'),
('timeline-003', 'request-002', 'APPROVED', 'Approved by department head', 'admin-001', NOW() - INTERVAL '2 days'),
('timeline-004', 'request-003', 'PENDING', 'Request submitted', 'faculty-001', NOW() - INTERVAL '10 days'),
('timeline-005', 'request-003', 'REJECTED', 'Please reschedule - important exam scheduled for that day', 'admin-001', NOW() - INTERVAL '8 days');

-- ============================================================================
-- Faculty Notifications
-- ============================================================================

INSERT INTO faculty_notifications (id, faculty_id, type, title, message, is_read, link, created_at) VALUES
('notif-001', 'faculty-001', 'REQUEST_UPDATE', 'Request Approved',
 'Your reschedule request for CS601 Lab has been approved.',
 false, '/faculty/requests?id=request-002', NOW() - INTERVAL '2 days'),
('notif-002', 'faculty-001', 'SCHEDULE_CHANGE', 'Room Change',
 'CS501 Monday class has been moved to LH-102 due to maintenance.',
 false, '/faculty/timetable', NOW() - INTERVAL '3 days'),
('notif-003', 'faculty-001', 'ANNOUNCEMENT', 'Department Meeting',
 'Reminder: Faculty meeting scheduled for Friday at 3:00 PM.',
 true, NULL, NOW() - INTERVAL '4 days'),
('notif-004', 'faculty-001', 'REQUEST_UPDATE', 'Request Rejected',
 'Your leave request for the scheduled date has been rejected. Please check comments.',
 true, '/faculty/requests?id=request-003', NOW() - INTERVAL '8 days'),
('notif-005', 'faculty-001', 'REMINDER', 'Attendance Submission',
 'Please submit attendance records for last week before Wednesday.',
 true, NULL, NOW() - INTERVAL '10 days'),
('notif-006', 'faculty-001', 'SYSTEM', 'Profile Update Reminder',
 'Please update your faculty profile with your latest publications.',
 false, '/faculty/profile', NOW() - INTERVAL '1 day');
