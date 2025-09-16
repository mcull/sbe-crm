-- Insert sample courses (WSET Levels 1-4)
INSERT INTO courses (name, wset_level, description, duration_weeks, price, max_capacity) VALUES
('WSET Level 1 Award in Wines', 1, 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.', 1, 199.00, 16),
('WSET Level 1 Award in Spirits', 1, 'An introduction to the world of spirits, perfect for beginners and enthusiasts alike.', 1, 199.00, 16),
('WSET Level 2 Award in Wines', 2, 'For those with some knowledge who want to understand wine in greater depth.', 2, 699.00, 20),
('WSET Level 2 Award in Spirits', 2, 'Building on Level 1, this course covers the main categories of spirits in detail.', 2, 699.00, 20),
('WSET Level 3 Award in Wines', 3, 'A comprehensive study of wines suitable for wine professionals and serious enthusiasts.', 6, 1299.00, 18),
('WSET Level 4 Diploma in Wines', 4, 'The most advanced qualification for wine professionals, covering viticulture, winemaking, and business.', 52, 4999.00, 12);

-- Insert sample course sessions for the next few months
INSERT INTO course_sessions (course_id, start_date, end_date, instructor, location, status) VALUES
(
  (SELECT id FROM courses WHERE name = 'WSET Level 1 Award in Wines' LIMIT 1),
  '2025-10-15', '2025-10-15',
  'Sarah Johnson', 'SBE Education Center, Atlanta',
  'scheduled'
),
(
  (SELECT id FROM courses WHERE name = 'WSET Level 2 Award in Wines' LIMIT 1),
  '2025-11-01', '2025-11-08',
  'Michael Chen', 'SBE Education Center, Atlanta',
  'scheduled'
),
(
  (SELECT id FROM courses WHERE name = 'WSET Level 1 Award in Spirits' LIMIT 1),
  '2025-10-22', '2025-10-22',
  'Emma Rodriguez', 'SBE Education Center, Atlanta',
  'scheduled'
);

-- This data will be inserted after you run the initial schema
-- You can add sample candidates and enrollments later if needed for testing