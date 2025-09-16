-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'completed', 'dropped');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE exam_type AS ENUM ('theory', 'tasting', 'practical');

-- Create users table for application users (separate from auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wset_level INTEGER NOT NULL CHECK (wset_level IN (1, 2, 3, 4)),
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2),
  max_capacity INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course_sessions table
CREATE TABLE course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  instructor TEXT,
  location TEXT,
  status session_status NOT NULL DEFAULT 'scheduled',
  current_enrollment INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  course_session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate enrollments
  UNIQUE(candidate_id, course_session_id)
);

-- Create exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exam_date TIMESTAMPTZ NOT NULL,
  exam_type exam_type NOT NULL,
  location TEXT NOT NULL,
  max_candidates INTEGER NOT NULL DEFAULT 20,
  current_registrations INTEGER DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_results table
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  pass_status BOOLEAN,
  certification_issued BOOLEAN DEFAULT FALSE,
  certificate_number TEXT,
  result_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate results
  UNIQUE(candidate_id, exam_id)
);

-- Create indexes for better performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX idx_course_sessions_dates ON course_sessions(start_date, end_date);
CREATE INDEX idx_enrollments_candidate_id ON enrollments(candidate_id);
CREATE INDEX idx_enrollments_session_id ON enrollments(course_session_id);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_exam_results_candidate_id ON exam_results(candidate_id);
CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);