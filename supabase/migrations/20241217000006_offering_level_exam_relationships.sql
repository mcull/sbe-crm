-- Create table for offering-level course-exam relationships
CREATE TABLE IF NOT EXISTS course_exam_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  exam_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  exam_window_days INTEGER DEFAULT 365, -- How long after course start can student take exam
  is_required BOOLEAN DEFAULT true, -- Is this exam required for course completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure no duplicate relationships
  UNIQUE(course_offering_id, exam_offering_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_exam_relationships_course ON course_exam_relationships(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_course_exam_relationships_exam ON course_exam_relationships(exam_offering_id);

-- Remove the session-level linked_course_offering_id column as it's too rigid
ALTER TABLE sessions DROP COLUMN IF EXISTS linked_course_offering_id;

-- Add enrollment tracking for online courses (students can start anytime)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  course_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  course_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'withdrawn')),

  -- Course access details
  access_expires_at TIMESTAMP WITH TIME ZONE, -- When course access expires
  exam_eligibility_expires_at TIMESTAMP WITH TIME ZONE, -- When exam eligibility expires

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure student can only enroll once per course offering
  UNIQUE(candidate_id, course_offering_id)
);

-- Add indexes for course enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_candidate ON course_enrollments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_offering ON course_enrollments(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

-- Add exam registrations to track when students register for specific exam sessions
CREATE TABLE IF NOT EXISTS exam_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  course_enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL, -- Link to course if exam is for a course
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'completed', 'no_show', 'cancelled')),

  -- Exam results
  score DECIMAL(5,2), -- Percentage score
  passed BOOLEAN,
  result_date TIMESTAMP WITH TIME ZONE,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Student can only register once per session
  UNIQUE(candidate_id, session_id)
);

-- Add indexes for exam registrations
CREATE INDEX IF NOT EXISTS idx_exam_registrations_candidate ON exam_registrations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_session ON exam_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_course_enrollment ON exam_registrations(course_enrollment_id);

-- Pre-populate course-exam relationships for WSET courses
INSERT INTO course_exam_relationships (course_offering_id, exam_offering_id, exam_window_days, is_required)
SELECT
  c.id as course_offering_id,
  e.id as exam_offering_id,
  365 as exam_window_days,
  true as is_required
FROM offerings c
CROSS JOIN offerings e
WHERE c.type = 'wset_course'
  AND e.type = 'standalone_exam'
  AND c.wset_level = e.wset_level
ON CONFLICT (course_offering_id, exam_offering_id) DO NOTHING;

-- Function to check if student is eligible for an exam session
CREATE OR REPLACE FUNCTION is_student_eligible_for_exam(
  student_candidate_id UUID,
  exam_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
  exam_offering_record RECORD;
  enrollment_record RECORD;
  relationship_exists BOOLEAN;
BEGIN
  -- Get session and exam offering details
  SELECT s.*, o.* INTO session_record
  FROM sessions s
  JOIN offerings o ON s.offering_id = o.id
  WHERE s.id = exam_session_id AND o.type = 'standalone_exam';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if student has an active course enrollment for a related course
  SELECT ce.* INTO enrollment_record
  FROM course_enrollments ce
  JOIN course_exam_relationships cer ON ce.course_offering_id = cer.course_offering_id
  WHERE ce.candidate_id = student_candidate_id
    AND cer.exam_offering_id = session_record.offering_id
    AND ce.status = 'active'
    AND ce.exam_eligibility_expires_at > NOW()
  LIMIT 1;

  -- If found a related course enrollment, student is eligible
  IF FOUND THEN
    RETURN TRUE;
  END IF;

  -- Otherwise, anyone can register for standalone exams
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the auto product generation function to handle the new model
CREATE OR REPLACE FUNCTION auto_create_product_for_session()
RETURNS TRIGGER AS $$
DECLARE
  offering_record RECORD;
  product_name TEXT;
  product_description TEXT;
  early_bird_price DECIMAL(10,2);
  product_metadata JSONB;
  new_product_id UUID;
  related_courses TEXT;
BEGIN
  -- Get the offering details
  SELECT * INTO offering_record
  FROM offerings
  WHERE id = NEW.offering_id
  AND auto_create_products = true;

  IF offering_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate intelligent product name
  IF NEW.name IS NOT NULL THEN
    product_name := NEW.name;
  ELSE
    product_name := offering_record.name || ' - ' || TO_CHAR(NEW.session_date, 'Mon DD, YYYY');

    IF NEW.location IS NOT NULL THEN
      product_name := product_name || ' (' || NEW.location || ')';
    END IF;
  END IF;

  -- Generate product description
  product_description := offering_record.description;

  IF offering_record.description IS NOT NULL THEN
    product_description := product_description || E'\n\nSession Details:';
  ELSE
    product_description := 'Session Details:';
  END IF;

  product_description := product_description || E'\n• Date: ' || TO_CHAR(NEW.session_date, 'Day, Mon DD, YYYY at HH12:MI AM');

  IF NEW.end_date IS NOT NULL AND NEW.end_date::DATE != NEW.session_date::DATE THEN
    product_description := product_description || E'\n• End Date: ' || TO_CHAR(NEW.end_date, 'Day, Mon DD, YYYY at HH12:MI AM');
  END IF;

  IF NEW.location IS NOT NULL THEN
    product_description := product_description || E'\n• Location: ' || NEW.location;
  END IF;

  IF NEW.instructor IS NOT NULL THEN
    product_description := product_description || E'\n• Instructor: ' || NEW.instructor;
  END IF;

  -- For exam sessions, add info about related courses
  IF offering_record.type = 'standalone_exam' THEN
    SELECT string_agg(co.name, ', ') INTO related_courses
    FROM course_exam_relationships cer
    JOIN offerings co ON cer.course_offering_id = co.id
    WHERE cer.exam_offering_id = offering_record.id;

    IF related_courses IS NOT NULL THEN
      product_description := product_description || E'\n• Available for students of: ' || related_courses;
      product_description := product_description || E'\n• Also available as standalone exam';
    END IF;
  END IF;

  product_description := product_description || E'\n• Capacity: ' || NEW.max_capacity || ' spots';
  product_description := product_description || E'\n• Delivery: ' || REPLACE(NEW.delivery_method::TEXT, '_', ' ');

  -- Calculate early bird price
  early_bird_price := ROUND(offering_record.base_price * (100 - COALESCE(NEW.early_bird_discount_percent, 0)) / 100.0, 2);

  -- Build comprehensive metadata
  product_metadata := offering_record.metadata || jsonb_build_object(
    'offering_type', offering_record.type,
    'wset_level', offering_record.wset_level,
    'session_id', NEW.id,
    'offering_id', offering_record.id,
    'session_date', NEW.session_date,
    'end_date', NEW.end_date,
    'location', NEW.location,
    'instructor', NEW.instructor,
    'delivery_method', NEW.delivery_method,
    'max_capacity', NEW.max_capacity,
    'base_price', offering_record.base_price,
    'early_bird_price', early_bird_price,
    'early_bird_deadline', NEW.early_bird_deadline,
    'registration_deadline', NEW.registration_deadline,
    'auto_generated', true,
    'related_courses', related_courses,
    'stripe_metadata', jsonb_build_object(
      'offering_type', offering_record.type,
      'session_id', NEW.id,
      'wset_level', offering_record.wset_level
    )
  );

  -- Insert the auto-generated product
  INSERT INTO products (
    name,
    description,
    type,
    base_price,
    sale_price,
    category,
    metadata,
    active,
    auto_generated,
    session_id,
    offering_id
  ) VALUES (
    product_name,
    product_description,
    CASE
      WHEN offering_record.type = 'tasting' THEN 'experience'
      WHEN offering_record.type = 'wset_course' THEN 'course'
      WHEN offering_record.type = 'standalone_exam' THEN 'spot_exam'
      ELSE 'course'
    END,
    offering_record.base_price,
    early_bird_price,
    'education',
    product_metadata,
    true,
    true,
    NEW.id,
    NEW.offering_id
  ) RETURNING id INTO new_product_id;

  -- Update the session with the generated product ID
  UPDATE sessions SET product_id = new_product_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;