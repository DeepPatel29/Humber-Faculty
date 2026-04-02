-- Seed data with proper UUID generation
-- Using DO block for proper UUID handling

DO $$
DECLARE
  -- Department IDs
  dept_cs_id UUID := gen_random_uuid();
  dept_math_id UUID := gen_random_uuid();
  dept_physics_id UUID := gen_random_uuid();
  
  -- User IDs
  user_john_id UUID := gen_random_uuid();
  user_sarah_id UUID := gen_random_uuid();
  user_michael_id UUID := gen_random_uuid();
  
  -- Faculty IDs
  faculty_john_id UUID := gen_random_uuid();
  faculty_sarah_id UUID := gen_random_uuid();
  faculty_michael_id UUID := gen_random_uuid();
  
  -- Course IDs
  course_cs101_id UUID := gen_random_uuid();
  course_cs201_id UUID := gen_random_uuid();
  course_cs301_id UUID := gen_random_uuid();
  course_math101_id UUID := gen_random_uuid();
  course_math201_id UUID := gen_random_uuid();
  course_phys101_id UUID := gen_random_uuid();
  
  -- Room IDs
  room_101_id UUID := gen_random_uuid();
  room_102_id UUID := gen_random_uuid();
  room_201_id UUID := gen_random_uuid();
  room_lab1_id UUID := gen_random_uuid();
  room_lecture_id UUID := gen_random_uuid();
  
  -- Schedule IDs
  schedule1_id UUID := gen_random_uuid();
  schedule2_id UUID := gen_random_uuid();
  schedule3_id UUID := gen_random_uuid();
  schedule4_id UUID := gen_random_uuid();
  schedule5_id UUID := gen_random_uuid();
  
BEGIN
  -- Clear existing data
  DELETE FROM notifications;
  DELETE FROM faculty_requests;
  DELETE FROM faculty_schedules;
  DELETE FROM faculty_availability;
  DELETE FROM faculty;
  DELETE FROM sessions;
  DELETE FROM users;
  DELETE FROM courses;
  DELETE FROM rooms;
  DELETE FROM departments;

  -- Insert Departments
  INSERT INTO departments (id, name, code, description) VALUES
    (dept_cs_id, 'Computer Science', 'CS', 'Department of Computer Science and Engineering'),
    (dept_math_id, 'Mathematics', 'MATH', 'Department of Mathematics and Statistics'),
    (dept_physics_id, 'Physics', 'PHYS', 'Department of Physics and Applied Sciences');

  -- Insert Users (password is 'password123' hashed - for demo purposes using a placeholder)
  INSERT INTO users (id, email, name, password_hash, role) VALUES
    (user_john_id, 'john.smith@university.edu', 'Dr. John Smith', '$2b$10$placeholder_hash_for_demo', 'FACULTY'),
    (user_sarah_id, 'sarah.johnson@university.edu', 'Dr. Sarah Johnson', '$2b$10$placeholder_hash_for_demo', 'FACULTY'),
    (user_michael_id, 'michael.chen@university.edu', 'Dr. Michael Chen', '$2b$10$placeholder_hash_for_demo', 'FACULTY');

  -- Insert Rooms
  INSERT INTO rooms (id, name, building, capacity, room_type, facilities) VALUES
    (room_101_id, 'Room 101', 'Science Building', 40, 'CLASSROOM', ARRAY['projector', 'whiteboard', 'ac']),
    (room_102_id, 'Room 102', 'Science Building', 35, 'CLASSROOM', ARRAY['projector', 'whiteboard']),
    (room_201_id, 'Room 201', 'Engineering Building', 50, 'LECTURE_HALL', ARRAY['projector', 'microphone', 'recording']),
    (room_lab1_id, 'Computer Lab 1', 'Tech Center', 30, 'LAB', ARRAY['computers', 'projector', 'whiteboard']),
    (room_lecture_id, 'Main Lecture Hall', 'Main Building', 200, 'LECTURE_HALL', ARRAY['projector', 'microphone', 'recording', 'ac']);

  -- Insert Courses
  INSERT INTO courses (id, code, name, description, credits, department_id) VALUES
    (course_cs101_id, 'CS101', 'Introduction to Programming', 'Fundamentals of programming using Python', 3, dept_cs_id),
    (course_cs201_id, 'CS201', 'Data Structures', 'Arrays, linked lists, trees, and graphs', 4, dept_cs_id),
    (course_cs301_id, 'CS301', 'Algorithms', 'Algorithm design and analysis', 4, dept_cs_id),
    (course_math101_id, 'MATH101', 'Calculus I', 'Differential calculus fundamentals', 4, dept_math_id),
    (course_math201_id, 'MATH201', 'Linear Algebra', 'Vectors, matrices, and linear transformations', 3, dept_math_id),
    (course_phys101_id, 'PHYS101', 'Physics I', 'Mechanics and thermodynamics', 4, dept_physics_id);

  -- Insert Faculty
  INSERT INTO faculty (id, employee_id, user_id, department_id, designation, specializations, qualifications, bio, office_location, office_hours, phone, status) VALUES
    (faculty_john_id, 'EMP001', user_john_id, dept_cs_id, 'PROFESSOR', 
     ARRAY['Machine Learning', 'Artificial Intelligence', 'Data Science'],
     ARRAY['Ph.D. in Computer Science, MIT (2010)', 'M.S. in Computer Science, Stanford (2006)'],
     'Dr. John Smith is a professor of Computer Science with over 15 years of experience in AI and machine learning research.',
     'Science Building, Room 305',
     '{"monday": "10:00-12:00", "wednesday": "14:00-16:00", "friday": "10:00-11:00"}'::jsonb,
     '+1-555-0101', 'ACTIVE'),
    (faculty_sarah_id, 'EMP002', user_sarah_id, dept_math_id, 'ASSOCIATE_PROFESSOR',
     ARRAY['Applied Mathematics', 'Statistics', 'Numerical Analysis'],
     ARRAY['Ph.D. in Mathematics, Harvard (2012)', 'M.S. in Applied Mathematics, Princeton (2008)'],
     'Dr. Sarah Johnson specializes in applied mathematics and has published extensively in numerical analysis.',
     'Math Building, Room 210',
     '{"tuesday": "09:00-11:00", "thursday": "13:00-15:00"}'::jsonb,
     '+1-555-0102', 'ACTIVE'),
    (faculty_michael_id, 'EMP003', user_michael_id, dept_physics_id, 'ASSISTANT_PROFESSOR',
     ARRAY['Quantum Physics', 'Particle Physics', 'Cosmology'],
     ARRAY['Ph.D. in Physics, Caltech (2018)', 'M.S. in Physics, UCLA (2014)'],
     'Dr. Michael Chen is an emerging researcher in quantum physics with focus on particle interactions.',
     'Physics Building, Room 115',
     '{"monday": "14:00-16:00", "wednesday": "10:00-12:00"}'::jsonb,
     '+1-555-0103', 'ACTIVE');

  -- Insert Faculty Availability
  INSERT INTO faculty_availability (id, faculty_id, day_of_week, start_time, end_time, is_available, preference_level) VALUES
    (gen_random_uuid(), faculty_john_id, 0, '09:00', '17:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_john_id, 1, '09:00', '17:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_john_id, 2, '09:00', '17:00', true, 'AVAILABLE'),
    (gen_random_uuid(), faculty_john_id, 3, '09:00', '17:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_john_id, 4, '09:00', '14:00', true, 'AVAILABLE'),
    (gen_random_uuid(), faculty_sarah_id, 0, '08:00', '16:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_sarah_id, 1, '08:00', '16:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_sarah_id, 2, '10:00', '18:00', true, 'AVAILABLE'),
    (gen_random_uuid(), faculty_sarah_id, 3, '08:00', '16:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_michael_id, 0, '10:00', '18:00', true, 'AVAILABLE'),
    (gen_random_uuid(), faculty_michael_id, 1, '09:00', '17:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_michael_id, 2, '09:00', '17:00', true, 'PREFERRED'),
    (gen_random_uuid(), faculty_michael_id, 3, '10:00', '18:00', true, 'AVAILABLE');

  -- Insert Faculty Schedules
  INSERT INTO faculty_schedules (id, faculty_id, course_id, room_id, day_of_week, start_time, end_time, schedule_type, semester, academic_year, is_active) VALUES
    (schedule1_id, faculty_john_id, course_cs101_id, room_101_id, 1, '09:00', '10:30', 'LECTURE', 'Spring', '2024-2025', true),
    (schedule2_id, faculty_john_id, course_cs201_id, room_lab1_id, 2, '14:00', '16:00', 'LAB', 'Spring', '2024-2025', true),
    (schedule3_id, faculty_john_id, course_cs301_id, room_201_id, 3, '11:00', '12:30', 'LECTURE', 'Spring', '2024-2025', true),
    (schedule4_id, faculty_sarah_id, course_math101_id, room_102_id, 1, '11:00', '12:30', 'LECTURE', 'Spring', '2024-2025', true),
    (schedule5_id, faculty_sarah_id, course_math201_id, room_101_id, 3, '09:00', '10:30', 'LECTURE', 'Spring', '2024-2025', true);

  -- Insert Notifications
  INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url) VALUES
    (gen_random_uuid(), user_john_id, 'Schedule Updated', 'Your Monday lecture has been moved to Room 201.', 'SCHEDULE_CHANGE', false, '/faculty/timetable'),
    (gen_random_uuid(), user_john_id, 'New Request', 'You have a pending class swap request from Dr. Sarah Johnson.', 'REQUEST', false, '/faculty/requests'),
    (gen_random_uuid(), user_john_id, 'Meeting Reminder', 'Department meeting tomorrow at 2:00 PM.', 'ANNOUNCEMENT', true, NULL),
    (gen_random_uuid(), user_sarah_id, 'Request Approved', 'Your leave request for March 15 has been approved.', 'APPROVAL', false, '/faculty/requests'),
    (gen_random_uuid(), user_sarah_id, 'New Assignment', 'You have been assigned to cover CS101 on Friday.', 'SCHEDULE_CHANGE', false, '/faculty/timetable'),
    (gen_random_uuid(), user_michael_id, 'Welcome', 'Welcome to FacultyHub! Complete your profile to get started.', 'SYSTEM', false, '/faculty/profile');

  -- Insert Sample Requests
  INSERT INTO faculty_requests (id, faculty_id, request_type, status, title, description, metadata) VALUES
    (gen_random_uuid(), faculty_john_id, 'SWAP', 'PENDING', 'Class Swap Request', 
     'Requesting to swap CS101 Monday lecture with Dr. Johnson''s MATH101.',
     '{"target_faculty_id": "' || faculty_sarah_id || '", "original_schedule_id": "' || schedule1_id || '"}'::jsonb),
    (gen_random_uuid(), faculty_sarah_id, 'LEAVE', 'APPROVED', 'Personal Leave',
     'Requesting leave for personal reasons.',
     '{"start_date": "2024-03-15", "end_date": "2024-03-15", "leave_type": "personal"}'::jsonb),
    (gen_random_uuid(), faculty_john_id, 'RESCHEDULE', 'PENDING', 'Reschedule Lab Session',
     'Need to reschedule Wednesday lab due to conference.',
     '{"original_date": "2024-03-20", "proposed_date": "2024-03-22", "reason": "conference"}'::jsonb);

  RAISE NOTICE 'Seed data inserted successfully!';
END $$;
