# GitHub Issue: Implement Comprehensive WSET Exam Management System

## Issue Title
🎓 Implement comprehensive WSET exam management system with bundled/standalone scheduling

## Priority
High - Core business functionality

## Epic Description
Replace the current simplified exam model with a comprehensive system that handles WSET's complex exam requirements including bundled exams, flexible scheduling, makeup exams, resits, and enquiries.

## User Stories

### As an Administrator, I want to:
- [ ] **Automatically generate exam templates** when creating course offerings
- [ ] **Auto-create bundled exam sessions** when scheduling in-person course sessions
- [ ] **Schedule standalone exam sessions** for makeups, resits, and remote invigilation
- [ ] **Manage exam capacity and registrations** across all exam types
- [ ] **Enter exam results** with support for Level 3's separate theory/tasting scores
- [ ] **Process exam enquiries** (result challenges) with workflow tracking
- [ ] **View comprehensive exam calendar** with all session types
- [ ] **Generate exam-related products** automatically with appropriate pricing

### As a Student, I want to:
- [ ] **See my bundled exam details** when enrolled in in-person courses
- [ ] **Schedule remote invigilation** for online courses within my eligibility window
- [ ] **Request makeup exams** if I miss a bundled exam
- [ ] **Register for resit exams** at the next available in-person session
- [ ] **Submit exam enquiries** to challenge results (with separate theory/tasting for Level 3)
- [ ] **View my complete exam history** with all attempts and scores

## Technical Requirements

### Database Schema

#### 1. Exam Templates (`exam_templates`)
```sql
CREATE TABLE exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('theory', 'tasting', 'combined')),
  duration_minutes INTEGER NOT NULL,
  pass_mark_percentage DECIMAL(5,2) NOT NULL DEFAULT 55.00,
  max_score INTEGER DEFAULT 100,

  -- Bundling configuration
  is_bundled_with_course BOOLEAN DEFAULT true,
  bundled_timing TEXT CHECK (bundled_timing IN ('same_day', 'final_day', 'separate_day')),

  -- Scheduling rules
  can_schedule_independently BOOLEAN DEFAULT false,
  scheduling_window_days INTEGER DEFAULT 365,

  -- Exam services
  allows_resits BOOLEAN DEFAULT true,
  allows_enquiries BOOLEAN DEFAULT true,

  -- Pricing for standalone bookings
  makeup_fee DECIMAL(10,2) DEFAULT 75.00,
  resit_fee DECIMAL(10,2) DEFAULT 75.00,
  remote_invigilation_fee DECIMAL(10,2) DEFAULT 50.00,
  enquiry_fee DECIMAL(10,2) DEFAULT 50.00,

  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Exam Sessions (`exam_sessions`)
```sql
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
  course_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL for standalone

  -- Session identification
  name TEXT, -- Auto-generated if NULL
  description TEXT,

  -- Scheduling
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
    'bundled',           -- Included with course
    'makeup',            -- For missed bundled exams
    'resit',             -- For failed exam retakes
    'remote_invigilation', -- Online course exams
    'standalone'         -- Independent exam bookings
  )),

  -- Booking configuration
  booking_enabled BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,

  -- Auto-generated commerce
  product_id UUID REFERENCES products(id),

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Exam Registrations (`exam_registrations`)
```sql
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
```

#### 4. Exam Enquiries (`exam_enquiries`)
```sql
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

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Auto-Generation Logic

#### Exam Template Creation Trigger
```sql
CREATE OR REPLACE FUNCTION auto_create_exam_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for WSET course offerings
  IF NEW.type = 'wset_course' THEN

    -- Level 1: Single combined exam
    IF NEW.wset_level = 1 THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee
      ) VALUES (
        NEW.id, 'Level 1 Theory Exam', 'combined', 45,
        true, 'same_day',
        (NEW.metadata->>'course_format' = 'online'), 75, 75, 50
      );

    -- Level 2: Theory exam
    ELSIF NEW.wset_level = 2 THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee
      ) VALUES (
        NEW.id, 'Level 2 Theory Exam', 'theory', 60,
        true, 'final_day',
        (NEW.metadata->>'course_format' = 'online'), 85, 85, 60
      );

    -- Level 3: Separate theory and tasting exams
    ELSIF NEW.wset_level = 3 THEN
      INSERT INTO exam_templates (
        course_offering_id, name, exam_type, duration_minutes, pass_mark_percentage,
        is_bundled_with_course, bundled_timing,
        can_schedule_independently, makeup_fee, resit_fee, remote_invigilation_fee, enquiry_fee
      ) VALUES
      (
        NEW.id, 'Level 3 Theory Exam', 'theory', 120, 55,
        true, 'final_day',
        (NEW.metadata->>'course_format' = 'online'), 125, 125, 90, 50
      ),
      (
        NEW.id, 'Level 3 Tasting Exam', 'tasting', 90, 55,
        true, 'final_day',
        false, 125, 125, 90, 50  -- Tasting can't be done remotely
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_exam_templates
  AFTER INSERT ON offerings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_exam_templates();
```

#### Exam Session Creation Trigger
```sql
CREATE OR REPLACE FUNCTION auto_create_exam_sessions()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  exam_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get exam templates for this course offering
  FOR template_record IN
    SELECT et.* FROM exam_templates et
    WHERE et.course_offering_id = NEW.offering_id
    AND et.is_bundled_with_course = true
    AND et.active = true
  LOOP

    -- Calculate exam date based on bundled timing
    IF template_record.bundled_timing = 'same_day' THEN
      exam_date := NEW.session_date;
    ELSIF template_record.bundled_timing = 'final_day' THEN
      exam_date := COALESCE(NEW.end_date, NEW.session_date);
    ELSE
      exam_date := NEW.session_date + INTERVAL '1 day';
    END IF;

    -- Create bundled exam session
    INSERT INTO exam_sessions (
      exam_template_id, course_session_id, exam_date,
      location, delivery_method, max_capacity,
      session_type, booking_enabled
    ) VALUES (
      template_record.id, NEW.id, exam_date,
      NEW.location, NEW.delivery_method, NEW.max_capacity,
      'bundled', NEW.booking_enabled
    );

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_exam_sessions
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_exam_sessions();
```

## Implementation Tasks

### Phase 1: Database Foundation (Week 1-2)
- [ ] Create exam management database tables
- [ ] Implement auto-generation triggers
- [ ] Create database migration scripts
- [ ] Add necessary indexes for performance
- [ ] Write database seeding scripts for existing courses

### Phase 2: Backend API (Week 3-4)
- [ ] Create TypeScript types for exam entities
- [ ] Implement CRUD operations for exam templates
- [ ] Implement CRUD operations for exam sessions
- [ ] Build exam registration management API
- [ ] Create exam enquiry workflow API
- [ ] Add result entry and management endpoints
- [ ] Implement auto-pricing logic for exam products

### Phase 3: Admin UI - Exam Management (Week 5-6)
- [ ] Build exam template management interface
- [ ] Create exam session scheduling dashboard
- [ ] Implement exam calendar view with filtering
- [ ] Build result entry interface with theory/tasting support
- [ ] Create enquiry management workflow UI
- [ ] Add exam reporting and analytics dashboard

### Phase 4: Course Integration (Week 7)
- [ ] Update course session detail pages to show bundled exams
- [ ] Add exam registration management to course sessions
- [ ] Integrate exam capacity with course enrollment limits
- [ ] Build makeup exam request workflow

### Phase 5: Student-Facing Features (Week 8-9)
- [ ] Add exam scheduling interface for online course students
- [ ] Build student exam history dashboard
- [ ] Create makeup exam request form
- [ ] Implement resit exam registration
- [ ] Build exam enquiry submission interface

### Phase 6: Commerce Integration (Week 10)
- [ ] Auto-generate products for standalone exam bookings
- [ ] Implement dynamic pricing for makeup/resit/enquiry fees
- [ ] Integrate with Stripe for exam-related payments
- [ ] Add exam products to main product catalog

### Phase 7: Notifications & Automation (Week 11)
- [ ] Build email notifications for exam scheduling
- [ ] Create automated reminders for upcoming exams
- [ ] Implement result notification system
- [ ] Add enquiry status update notifications

### Phase 8: Migration & Testing (Week 12)
- [ ] Create data migration scripts for existing exam data
- [ ] Comprehensive testing of all exam workflows
- [ ] User acceptance testing with admin team
- [ ] Performance optimization and load testing
- [ ] Documentation and training materials

## Acceptance Criteria

### Functional Requirements
- [ ] **Automatic exam template creation** when course offerings are created
- [ ] **Bundled exam session generation** when in-person courses are scheduled
- [ ] **Flexible exam scheduling** for online course students with 1-year window
- [ ] **Makeup exam workflow** for students who miss bundled exams
- [ ] **Resit exam registration** at next available in-person session
- [ ] **Dual-component results** entry for Level 3 (theory + tasting)
- [ ] **Exam enquiry workflow** with fee management and outcome tracking
- [ ] **Comprehensive exam calendar** showing all session types
- [ ] **Automated product generation** for all exam service types
- [ ] **Student exam dashboard** showing history and upcoming sessions

### Technical Requirements
- [ ] **Database performance**: All exam queries under 100ms
- [ ] **Auto-generation reliability**: 100% success rate for template/session creation
- [ ] **Data integrity**: Complete audit trail for all exam activities
- [ ] **Scalability**: Support for 1000+ concurrent exam registrations
- [ ] **Integration**: Seamless Stripe payment processing
- [ ] **Mobile responsive**: All interfaces work on mobile devices

### Business Requirements
- [ ] **Revenue tracking**: Clear attribution for all exam-related income
- [ ] **Compliance**: Audit trail meets WSET requirements
- [ ] **Flexibility**: Easy configuration of exam rules and pricing
- [ ] **Reporting**: Comprehensive exam analytics and insights
- [ ] **User experience**: Intuitive workflows for both admin and students

## Definition of Done
- [ ] All database tables created and documented
- [ ] Complete API coverage with TypeScript types
- [ ] Full admin UI for exam management
- [ ] Student-facing exam scheduling and history
- [ ] Automated product generation and pricing
- [ ] Email notification system implemented
- [ ] Data migration completed successfully
- [ ] Comprehensive test coverage (>90%)
- [ ] Documentation and training materials complete
- [ ] Production deployment successful
- [ ] User acceptance sign-off from Phillip

## Risk Mitigation
- **Data Migration**: Create parallel system and migrate incrementally
- **Performance**: Implement caching and database optimization from day one
- **User Adoption**: Extensive user testing and feedback incorporation
- **Integration**: Thorough testing with Stripe and existing systems
- **Complexity**: Break into smaller, testable components with clear interfaces

This comprehensive exam system will provide the foundation for managing all WSET exam scenarios while maintaining the flexibility needed for future requirements.