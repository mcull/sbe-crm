-- Comprehensive WSET Exam Management System
-- This migration creates the foundation for handling all exam scenarios:
-- bundled exams, standalone scheduling, makeup/resit exams, and enquiries

-- =============================================
-- 1. EXAM TEMPLATES
-- Defines the exam structure for each course offering
-- =============================================

CREATE TABLE exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

  -- Template identification
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('theory', 'tasting', 'combined')),

  -- Exam specifications
  duration_minutes INTEGER NOT NULL,
  pass_mark_percentage DECIMAL(5,2) NOT NULL DEFAULT 55.00,
  max_score INTEGER DEFAULT 100,

  -- Bundling configuration
  is_bundled_with_course BOOLEAN DEFAULT true,
  bundled_timing TEXT CHECK (bundled_timing IN ('same_day', 'final_day', 'separate_day')),

  -- Scheduling rules
  can_schedule_independently BOOLEAN DEFAULT false,
  scheduling_window_days INTEGER DEFAULT 365,

  -- Exam services availability
  allows_resits BOOLEAN DEFAULT true,
  allows_enquiries BOOLEAN DEFAULT true,

  -- Pricing for standalone bookings
  makeup_fee DECIMAL(10,2) DEFAULT 75.00,
  resit_fee DECIMAL(10,2) DEFAULT 75.00,
  remote_invigilation_fee DECIMAL(10,2) DEFAULT 50.00,
  enquiry_fee DECIMAL(10,2) DEFAULT 50.00,

  -- Status and metadata
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_exam_templates_course_offering ON exam_templates(course_offering_id);
CREATE INDEX idx_exam_templates_active ON exam_templates(active) WHERE active = true;
CREATE INDEX idx_exam_templates_type ON exam_templates(exam_type);

-- =============================================
-- 2. EXAM SESSIONS
-- Scheduled instances of exams (bundled and standalone)
-- =============================================

CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
  course_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL for standalone

  -- Session identification
  name TEXT, -- Auto-generated if NULL
  description TEXT,

  -- Scheduling details
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  exam_end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  proctor TEXT,
  delivery_method delivery_method DEFAULT 'in_person',

  -- Capacity management
  max_capacity INTEGER NOT NULL DEFAULT 30,
  current_enrollment INTEGER DEFAULT 0,
  available_spots INTEGER GENERATED ALWAYS AS (max_capacity - current_enrollment) STORED,

  -- Session classification
  session_type TEXT NOT NULL CHECK (session_type IN (
    'bundled',              -- Included with course
    'makeup',               -- For missed bundled exams
    'resit',                -- For failed exam retakes
    'remote_invigilation',  -- Online course exams
    'standalone'            -- Independent exam bookings
  )),

  -- Booking configuration
  booking_enabled BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,

  -- Auto-generated commerce
  product_id UUID REFERENCES products(id),

  -- Status tracking
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

  -- Metadata and audit
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_exam_sessions_template ON exam_sessions(exam_template_id);
CREATE INDEX idx_exam_sessions_course_session ON exam_sessions(course_session_id);
CREATE INDEX idx_exam_sessions_date ON exam_sessions(exam_date);
CREATE INDEX idx_exam_sessions_type ON exam_sessions(session_type);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_booking_enabled ON exam_sessions(booking_enabled) WHERE booking_enabled = true;

-- =============================================
-- 3. EXAM REGISTRATIONS
-- Student enrollments for specific exam sessions
-- =============================================

CREATE TABLE exam_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  course_enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL,

  -- Registration metadata
  registration_type TEXT NOT NULL CHECK (registration_type IN (
    'bundled', 'makeup', 'resit', 'remote_invigilation', 'standalone'
  )),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Payment tracking
  fee_amount DECIMAL(10,2) DEFAULT 0.00,
  fee_paid BOOLEAN DEFAULT false,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,

  -- Exam attempt tracking
  attempt_number INTEGER DEFAULT 1,
  is_makeup BOOLEAN DEFAULT false,
  is_resit BOOLEAN DEFAULT false,

  -- Status management
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
  )),

  -- Results (supporting Level 3's dual components)
  theory_score DECIMAL(5,2),
  theory_passed BOOLEAN,
  tasting_score DECIMAL(5,2),
  tasting_passed BOOLEAN,
  overall_score DECIMAL(5,2),
  overall_passed BOOLEAN,

  -- Result metadata
  result_date TIMESTAMP WITH TIME ZONE,
  result_entered_by UUID REFERENCES users(id),
  result_notes TEXT,

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(candidate_id, exam_session_id),
  CHECK (
    (theory_score IS NULL AND tasting_score IS NULL) OR
    (theory_score IS NOT NULL OR tasting_score IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_exam_registrations_candidate ON exam_registrations(candidate_id);
CREATE INDEX idx_exam_registrations_session ON exam_registrations(exam_session_id);
CREATE INDEX idx_exam_registrations_course_enrollment ON exam_registrations(course_enrollment_id);
CREATE INDEX idx_exam_registrations_type ON exam_registrations(registration_type);
CREATE INDEX idx_exam_registrations_status ON exam_registrations(status);
CREATE INDEX idx_exam_registrations_attempt ON exam_registrations(attempt_number);

-- =============================================
-- 4. EXAM ENQUIRIES
-- Result challenge workflow
-- =============================================

CREATE TABLE exam_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_registration_id UUID NOT NULL REFERENCES exam_registrations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Enquiry details
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('theory', 'tasting', 'both')),
  reason TEXT NOT NULL,
  supporting_evidence TEXT,

  -- Fee management
  enquiry_fee DECIMAL(10,2) NOT NULL,
  fee_paid BOOLEAN DEFAULT false,
  fee_refunded BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,

  -- Workflow status
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'payment_pending', 'under_review', 'completed', 'rejected', 'withdrawn'
  )),

  -- Review process
  reviewed_by UUID REFERENCES users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- Outcome
  outcome TEXT CHECK (outcome IN ('upheld', 'rejected', 'partial')),
  score_change_theory DECIMAL(5,2),
  score_change_tasting DECIMAL(5,2),
  result_changed BOOLEAN DEFAULT false,

  -- Notifications
  student_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,

  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_exam_enquiries_registration ON exam_enquiries(exam_registration_id);
CREATE INDEX idx_exam_enquiries_candidate ON exam_enquiries(candidate_id);
CREATE INDEX idx_exam_enquiries_status ON exam_enquiries(status);
CREATE INDEX idx_exam_enquiries_type ON exam_enquiries(enquiry_type);

-- =============================================
-- 5. AUTO-GENERATION TRIGGERS
-- Automatically create exam templates and sessions
-- =============================================

-- Function to auto-create exam templates when course offerings are created
CREATE OR REPLACE FUNCTION auto_create_exam_templates()
RETURNS TRIGGER AS $$
DECLARE
  qualification_category TEXT;
BEGIN
  -- Only for WSET course offerings
  IF NEW.type = 'wset_course' THEN

    -- Get qualification category from metadata
    qualification_category := COALESCE(NEW.metadata->>'qualification_category', 'wines');

    -- Level 1: Single combined exam
    IF NEW.wset_level = 1 THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
      ) VALUES (
        NEW.id,
        'Level 1 ' || INITCAP(qualification_category) || ' Exam',
        'combined',
        45,
        true,
        'same_day',
        (NEW.metadata->>'course_format' = 'online'),
        75, 75, 50, 50
      );

    -- Level 2: Theory exam
    ELSIF NEW.wset_level = 2 THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
      ) VALUES (
        NEW.id,
        'Level 2 ' || INITCAP(qualification_category) || ' Theory Exam',
        'theory',
        60,
        true,
        'final_day',
        (NEW.metadata->>'course_format' = 'online'),
        85, 85, 60, 50
      );

    -- Level 3: Separate theory and tasting exams
    ELSIF NEW.wset_level = 3 THEN
      -- Theory exam
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes, pass_mark_percentage,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
      ) VALUES (
        NEW.id,
        'Level 3 ' || INITCAP(qualification_category) || ' Theory Exam',
        'theory',
        120,
        55,
        true,
        'final_day',
        (NEW.metadata->>'course_format' = 'online'),
        125, 125, 90, 50
      );

      -- Tasting exam (only for wines, spirits, sake - not beer)
      IF qualification_category != 'beer' THEN
        INSERT INTO exam_templates (
          course_offering_id, name, exam_type, duration_minutes, pass_mark_percentage,
          is_bundled_with_course, bundled_timing,
          can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
        ) VALUES (
          NEW.id,
          'Level 3 ' || INITCAP(qualification_category) || ' Tasting Exam',
          'tasting',
          90,
          55,
          true,
          'final_day',
          false, -- Tasting can't be done remotely
          125, 125, 0, 50  -- No remote invigilation for tasting
        );
      END IF;

    -- Level 4: Diploma (wines only)
    ELSIF NEW.wset_level = 4 AND qualification_category = 'wines' THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes, pass_mark_percentage,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
      ) VALUES (
        NEW.id,
        'Level 4 Diploma Theory Exam',
        'theory',
        180,
        60,
        true,
        'separate_day',
        true,
        200, 200, 150, 75
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exam template auto-creation
CREATE TRIGGER trigger_auto_create_exam_templates
  AFTER INSERT ON offerings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_exam_templates();

-- Function to auto-create exam sessions when course sessions are scheduled
CREATE OR REPLACE FUNCTION auto_create_exam_sessions()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  exam_date TIMESTAMP WITH TIME ZONE;
  exam_name TEXT;
BEGIN
  -- Get exam templates for this course offering
  FOR template_record IN
    SELECT et.* FROM exam_templates et
    WHERE et.course_offering_id = NEW.offering_id
    AND et.is_bundled_with_course = true
    AND et.active = true
  LOOP

    -- Calculate exam date based on bundled timing
    CASE template_record.bundled_timing
      WHEN 'same_day' THEN
        exam_date := NEW.session_date;
      WHEN 'final_day' THEN
        exam_date := COALESCE(NEW.end_date, NEW.session_date);
      WHEN 'separate_day' THEN
        exam_date := COALESCE(NEW.end_date, NEW.session_date) + INTERVAL '1 day';
      ELSE
        exam_date := NEW.session_date;
    END CASE;

    -- Generate exam session name
    exam_name := template_record.name || ' - ' || TO_CHAR(exam_date, 'Mon DD, YYYY');

    -- Create bundled exam session
    INSERT INTO exam_sessions (
      exam_template_id, course_session_id, name, exam_date,
      location, delivery_method, max_capacity,
      session_type, booking_enabled
    ) VALUES (
      template_record.id,
      NEW.id,
      exam_name,
      exam_date,
      NEW.location,
      NEW.delivery_method,
      NEW.max_capacity,
      'bundled',
      NEW.booking_enabled
    );

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exam session auto-creation
CREATE TRIGGER trigger_auto_create_exam_sessions
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_exam_sessions();

-- =============================================
-- 6. UTILITY FUNCTIONS
-- Helper functions for exam management
-- =============================================

-- Function to check if a student is eligible for an exam session
CREATE OR REPLACE FUNCTION is_student_eligible_for_exam(
  student_candidate_id UUID,
  target_exam_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
  template_record RECORD;
  enrollment_record RECORD;
BEGIN
  -- Get session and template details
  SELECT
    es.*,
    et.course_offering_id,
    et.can_schedule_independently,
    et.scheduling_window_days
  INTO session_record
  FROM exam_sessions es
  JOIN exam_templates et ON es.exam_template_id = et.id
  WHERE es.id = target_exam_session_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- For bundled exams, check course enrollment
  IF session_record.session_type = 'bundled' AND session_record.course_session_id IS NOT NULL THEN
    -- Check if student is enrolled in the course session
    SELECT ce.* INTO enrollment_record
    FROM course_enrollments ce
    JOIN sessions s ON ce.course_offering_id = s.offering_id
    WHERE ce.candidate_id = student_candidate_id
      AND s.id = session_record.course_session_id
      AND ce.status = 'active';

    RETURN FOUND;
  END IF;

  -- For independent scheduling, check course enrollment and eligibility window
  IF session_record.can_schedule_independently THEN
    SELECT ce.* INTO enrollment_record
    FROM course_enrollments ce
    WHERE ce.candidate_id = student_candidate_id
      AND ce.course_offering_id = session_record.course_offering_id
      AND ce.status = 'active'
      AND ce.exam_eligibility_expires_at > NOW();

    RETURN FOUND;
  END IF;

  -- For standalone exams (makeup, resit), allow registration
  IF session_record.session_type IN ('makeup', 'resit', 'standalone') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to update exam session enrollment count
CREATE OR REPLACE FUNCTION update_exam_session_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE exam_sessions
    SET current_enrollment = current_enrollment + 1
    WHERE id = NEW.exam_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE exam_sessions
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = OLD.exam_session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain enrollment counts
CREATE TRIGGER trigger_update_exam_enrollment_insert
  AFTER INSERT ON exam_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_session_enrollment();

CREATE TRIGGER trigger_update_exam_enrollment_delete
  AFTER DELETE ON exam_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_session_enrollment();

-- =============================================
-- 7. COMMENTS AND DOCUMENTATION
-- =============================================

-- Table comments
COMMENT ON TABLE exam_templates IS 'Defines exam structure and rules for course offerings';
COMMENT ON TABLE exam_sessions IS 'Scheduled instances of exams (bundled, standalone, makeup, etc.)';
COMMENT ON TABLE exam_registrations IS 'Student enrollments in specific exam sessions with results';
COMMENT ON TABLE exam_enquiries IS 'Exam result challenge workflow management';

-- Key column comments
COMMENT ON COLUMN exam_templates.bundled_timing IS 'When exam occurs relative to course: same_day, final_day, separate_day';
COMMENT ON COLUMN exam_templates.can_schedule_independently IS 'Whether students can schedule this exam separately (online courses)';
COMMENT ON COLUMN exam_sessions.session_type IS 'Classification: bundled, makeup, resit, remote_invigilation, standalone';
COMMENT ON COLUMN exam_registrations.registration_type IS 'How student registered: bundled, makeup, resit, remote_invigilation, standalone';
COMMENT ON COLUMN exam_enquiries.enquiry_type IS 'What component is being challenged: theory, tasting, or both';

-- Create initial exam templates for existing course offerings
-- This will be run as part of the migration to set up existing courses
DO $$
DECLARE
  course_record RECORD;
BEGIN
  -- Process existing WSET course offerings
  FOR course_record IN
    SELECT * FROM offerings
    WHERE type = 'wset_course'
    AND wset_level IS NOT NULL
  LOOP
    -- Trigger the auto-creation function for existing courses
    PERFORM auto_create_exam_templates() FROM (SELECT course_record.*) AS NEW;
  END LOOP;
END;
$$;