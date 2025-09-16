-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users only
-- Users table - only authenticated users can read, owners can manage
CREATE POLICY "Users can view all user records" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Allow users to update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Candidates table - authenticated users can manage
CREATE POLICY "Authenticated users can manage candidates" ON candidates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Courses table - authenticated users can manage
CREATE POLICY "Authenticated users can manage courses" ON courses
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Course sessions table - authenticated users can manage
CREATE POLICY "Authenticated users can manage course sessions" ON course_sessions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Enrollments table - authenticated users can manage
CREATE POLICY "Authenticated users can manage enrollments" ON enrollments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Exams table - authenticated users can manage
CREATE POLICY "Authenticated users can manage exams" ON exams
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Exam results table - authenticated users can manage
CREATE POLICY "Authenticated users can manage exam results" ON exam_results
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to create user record when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'admin'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when auth user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();