-- Insert sample data into existing tables

-- Insert departments
INSERT INTO departments (id, code, name, description) VALUES
  (gen_random_uuid(), 'CS', 'Computer Science', 'Department of Computer Science and Engineering'),
  (gen_random_uuid(), 'MATH', 'Mathematics', 'Department of Mathematics and Statistics'),
  (gen_random_uuid(), 'PHY', 'Physics', 'Department of Physics')
ON CONFLICT DO NOTHING;

-- Insert rooms
INSERT INTO rooms (id, name, building, capacity, has_projector, has_whiteboard) VALUES
  (gen_random_uuid(), 'Room 101', 'Main Building', 50, true, true),
  (gen_random_uuid(), 'Room 202', 'Science Block', 40, true, true),
  (gen_random_uuid(), 'Lab 301', 'Tech Center', 30, true, false)
ON CONFLICT DO NOTHING;

-- Insert a demo user with password "password123" (hashed)
INSERT INTO users (id, name, email, password_hash, role, email_verified)
SELECT gen_random_uuid(), 'Dr. John Smith', 'john.smith@university.edu', 
       '$pbkdf2$100000$randomsalt$hashedpassword', 'FACULTY', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'john.smith@university.edu');

-- Insert courses (referencing first department)
INSERT INTO courses (id, code, name, credits, department_id, description)
SELECT gen_random_uuid(), 'CS101', 'Introduction to Programming', 3, d.id, 'Basic programming concepts'
FROM departments d WHERE d.code = 'CS'
ON CONFLICT DO NOTHING;

INSERT INTO courses (id, code, name, credits, department_id, description)
SELECT gen_random_uuid(), 'CS201', 'Data Structures', 4, d.id, 'Advanced data structures and algorithms'
FROM departments d WHERE d.code = 'CS'
ON CONFLICT DO NOTHING;

-- Insert faculty (referencing user and department)
INSERT INTO faculty (id, user_id, department_id, employee_id, designation, phone, office_location, bio, specializations, qualifications)
SELECT gen_random_uuid(), u.id, d.id, 'EMP001', 'Associate Professor', '+1-555-0123', 'Room 405, CS Building',
       'Expert in Machine Learning and Data Science with 15 years of experience.',
       ARRAY['Machine Learning', 'Data Science', 'Artificial Intelligence'],
       ARRAY['Ph.D. Computer Science, MIT', 'M.S. Computer Science, Stanford']
FROM users u, departments d
WHERE u.email = 'john.smith@university.edu' AND d.code = 'CS'
ON CONFLICT DO NOTHING;
