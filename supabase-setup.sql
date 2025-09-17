-- SBE CRM Database Schema for Supabase
-- This script creates all the necessary tables for the CRM system

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  wset_level INTEGER NOT NULL CHECK (wset_level >= 1 AND wset_level <= 4),
  description TEXT,
  duration_weeks INTEGER DEFAULT 1,
  price DECIMAL(10,2),
  max_capacity INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_sessions table
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  instructor VARCHAR,
  location VARCHAR,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  current_enrollment INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  course_session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  status VARCHAR DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, course_session_id)
);

-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  exam_type VARCHAR NOT NULL CHECK (exam_type IN ('theory', 'tasting', 'practical')),
  location VARCHAR NOT NULL,
  max_candidates INTEGER DEFAULT 20,
  current_registrations INTEGER DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_results table
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  pass_status BOOLEAN,
  certification_issued BOOLEAN DEFAULT FALSE,
  certificate_number VARCHAR,
  result_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, exam_id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  email VARCHAR NOT NULL UNIQUE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON public.course_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON public.exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your needs)
-- For now, we'll allow authenticated users to do everything

-- Candidates policies
CREATE POLICY "Allow all operations for authenticated users" ON public.candidates
  FOR ALL USING (auth.role() = 'authenticated');

-- Courses policies
CREATE POLICY "Allow all operations for authenticated users" ON public.courses
  FOR ALL USING (auth.role() = 'authenticated');

-- Course sessions policies
CREATE POLICY "Allow all operations for authenticated users" ON public.course_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Enrollments policies
CREATE POLICY "Allow all operations for authenticated users" ON public.enrollments
  FOR ALL USING (auth.role() = 'authenticated');

-- Exams policies
CREATE POLICY "Allow all operations for authenticated users" ON public.exams
  FOR ALL USING (auth.role() = 'authenticated');

-- Exam results policies
CREATE POLICY "Allow all operations for authenticated users" ON public.exam_results
  FOR ALL USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY "Allow all operations for authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data for testing
INSERT INTO public.candidates (first_name, last_name, email, phone, notes) VALUES
  ('John', 'Doe', 'john.doe@example.com', '555-0101', 'Interested in Level 1 certification'),
  ('Jane', 'Smith', 'jane.smith@example.com', '555-0102', 'Previous wine experience'),
  ('Bob', 'Johnson', 'bob.johnson@example.com', '555-0103', NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.courses (name, wset_level, description, duration_weeks, price, max_capacity) VALUES
  ('WSET Level 1 Award in Wines', 1, 'An introduction to wine for beginners', 1, 325.00, 20),
  ('WSET Level 2 Award in Wines', 2, 'Intermediate wine course covering major wine regions', 2, 625.00, 16),
  ('WSET Level 3 Award in Wines', 3, 'Advanced wine course with tasting and theory', 8, 1250.00, 12)
ON CONFLICT DO NOTHING;