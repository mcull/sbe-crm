# WSET Exam Architecture Recommendation

## Overview

The current exam model is too simplistic for WSET's complex exam requirements. We need an architecture that handles:
- Bundled exams (in-person courses)
- Flexible scheduling (online courses with remote invigilation)
- Makeup/resit exams
- Exam enquiries (challenge results)
- Multiple exam components (Level 3 tasting + theory)

## Use Cases Analysis

### In-Person Courses
- **Level 1**: Same-day exam bundled with course
- **Level 2**: Exam on final day (day 2) of course
- **Level 3**: Full final day is exam, with separate tasting and theory components
- **Makeup Exams**: Students who miss can register for "next available in-person class"

### Online Courses
- **Course Start**: Student chooses when to begin online materials
- **Exam Scheduling**: Student can schedule remote invigilation anytime within 1 year
- **Flexibility**: Complete decoupling of course start and exam date

### Exam Services
- **Resit**: Retake exam at next scheduled in-person session
- **Enquiry**: Challenge exam results (Level 3 has separate tasting/theory enquiries)

## Recommended Architecture

### 1. Core Entities

#### `exam_templates`
Defines the exam structure for each course offering:
```sql
CREATE TABLE exam_templates (
  id UUID PRIMARY KEY,
  course_offering_id UUID REFERENCES offerings(id),
  name TEXT NOT NULL, -- "Level 1 Theory", "Level 3 Tasting", etc.
  exam_type TEXT NOT NULL CHECK (exam_type IN ('theory', 'tasting', 'combined')),
  duration_minutes INTEGER NOT NULL,
  pass_mark_percentage DECIMAL(5,2) NOT NULL,
  max_score INTEGER DEFAULT 100,

  -- Bundling rules
  is_bundled_with_course BOOLEAN DEFAULT true,
  bundled_timing TEXT, -- 'same_day', 'final_day', 'separate_day'

  -- Scheduling rules
  can_schedule_independently BOOLEAN DEFAULT false,
  scheduling_window_days INTEGER DEFAULT 365, -- For online courses

  -- Resit/enquiry eligibility
  allows_resits BOOLEAN DEFAULT true,
  allows_enquiries BOOLEAN DEFAULT true,

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `exam_sessions`
Scheduled instances of exams (both bundled and standalone):
```sql
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY,
  exam_template_id UUID REFERENCES exam_templates(id),
  course_session_id UUID REFERENCES sessions(id), -- NULL for standalone exams

  -- Session details
  name TEXT, -- Auto-generated or custom
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  exam_end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  proctor TEXT,
  delivery_method delivery_method DEFAULT 'in_person',

  -- Capacity
  max_capacity INTEGER NOT NULL,
  current_enrollment INTEGER DEFAULT 0,

  -- Exam type classification
  session_type TEXT NOT NULL CHECK (session_type IN (
    'bundled', 'makeup', 'resit', 'remote_invigilation', 'standalone'
  )),

  -- Booking settings
  booking_enabled BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,

  -- Auto-generated product
  product_id UUID REFERENCES products(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `exam_registrations`
Student registrations for specific exam sessions:
```sql
CREATE TABLE exam_registrations (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id),
  exam_session_id UUID REFERENCES exam_sessions(id),
  course_enrollment_id UUID REFERENCES course_enrollments(id), -- Links to course if applicable

  -- Registration details
  registration_type TEXT NOT NULL CHECK (registration_type IN (
    'bundled', 'makeup', 'resit', 'remote_invigilation', 'standalone'
  )),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Exam results
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'completed', 'no_show', 'cancelled', 'rescheduled'
  )),

  -- Results (multiple components for Level 3)
  theory_score DECIMAL(5,2),
  theory_passed BOOLEAN,
  tasting_score DECIMAL(5,2),
  tasting_passed BOOLEAN,
  overall_passed BOOLEAN,
  result_date TIMESTAMP WITH TIME ZONE,

  -- Fees
  fee_amount DECIMAL(10,2) DEFAULT 0,
  fee_paid BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `exam_enquiries`
Exam result challenges:
```sql
CREATE TABLE exam_enquiries (
  id UUID PRIMARY KEY,
  exam_registration_id UUID REFERENCES exam_registrations(id),
  candidate_id UUID REFERENCES candidates(id),

  -- Enquiry details
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('theory', 'tasting', 'both')),
  reason TEXT NOT NULL,
  enquiry_fee DECIMAL(10,2) NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'completed', 'rejected'
  )),

  -- Results
  outcome TEXT CHECK (outcome IN ('upheld', 'rejected', 'partial')),
  score_change_theory DECIMAL(5,2),
  score_change_tasting DECIMAL(5,2),
  result_changed BOOLEAN DEFAULT false,

  -- Refund if upheld
  fee_refunded BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Business Logic & Auto-Generation

#### Exam Template Auto-Creation
When course offerings are created, automatically generate appropriate exam templates:

```typescript
async function createExamTemplatesForCourse(courseOffering: Offering) {
  const templates = []

  if (courseOffering.wset_level === 1) {
    templates.push({
      name: `Level 1 Theory Exam`,
      exam_type: 'combined',
      duration_minutes: 45,
      pass_mark_percentage: 55,
      is_bundled_with_course: true,
      bundled_timing: 'same_day',
      can_schedule_independently: courseOffering.course_format === 'online'
    })
  } else if (courseOffering.wset_level === 2) {
    templates.push({
      name: `Level 2 Theory Exam`,
      exam_type: 'theory',
      duration_minutes: 60,
      pass_mark_percentage: 55,
      is_bundled_with_course: true,
      bundled_timing: 'final_day',
      can_schedule_independently: courseOffering.course_format === 'online'
    })
  } else if (courseOffering.wset_level === 3) {
    // Level 3 has separate tasting and theory
    templates.push(
      {
        name: `Level 3 Theory Exam`,
        exam_type: 'theory',
        duration_minutes: 120,
        pass_mark_percentage: 55,
        is_bundled_with_course: true,
        bundled_timing: 'final_day'
      },
      {
        name: `Level 3 Tasting Exam`,
        exam_type: 'tasting',
        duration_minutes: 90,
        pass_mark_percentage: 55,
        is_bundled_with_course: true,
        bundled_timing: 'final_day'
      }
    )
  }

  return await createExamTemplates(templates)
}
```

#### Exam Session Auto-Creation
When course sessions are scheduled, automatically create bundled exam sessions:

```typescript
async function createBundledExamSessions(courseSession: Session) {
  const examTemplates = await getExamTemplatesForCourse(courseSession.offering_id)

  for (const template of examTemplates.filter(t => t.is_bundled_with_course)) {
    const examDate = calculateExamDate(courseSession, template.bundled_timing)

    await createExamSession({
      exam_template_id: template.id,
      course_session_id: courseSession.id,
      exam_date: examDate,
      location: courseSession.location,
      max_capacity: courseSession.max_capacity,
      session_type: 'bundled',
      delivery_method: courseSession.delivery_method
    })
  }
}
```

### 3. CRM UI Design

#### Course Session Detail Page
- **Bundled Exams Section**: Show auto-created exam sessions
- **Exam Registrations**: List students registered for each exam component
- **Makeup Exam Requests**: Queue of students needing makeup exams

#### Exam Management Dashboard
- **Upcoming Exams**: Calendar view of all exam sessions
- **Remote Invigilation Queue**: Online course students ready to schedule
- **Makeup/Resit Scheduling**: Drag-and-drop interface for assigning students
- **Results Entry**: Form for entering theory/tasting scores
- **Enquiry Management**: Workflow for processing result challenges

#### Student Profile
- **Exam History**: All exam attempts with scores
- **Upcoming Exams**: Registered exam sessions
- **Available Actions**: Schedule makeup, request enquiry, book resit

### 4. Product & Pricing Integration

#### Auto-Generated Products
- **Bundled Course + Exam**: Single product (existing)
- **Makeup Exam**: Separate product for missed bundled exams
- **Resit Exam**: Product for retaking failed exams
- **Remote Invigilation**: Online exam scheduling product
- **Exam Enquiry**: Result challenge service product

#### Pricing Rules
```typescript
const EXAM_PRICING = {
  makeup: {
    level_1: 75, level_2: 85, level_3: 125
  },
  resit: {
    level_1: 75, level_2: 85, level_3: 125
  },
  remote_invigilation: {
    level_1: 50, level_2: 60, level_3: 90
  },
  enquiry: {
    theory: 50, tasting: 50, both: 90
  }
}
```

## Implementation Benefits

1. **Complete Use Case Coverage**: Handles all in-person, online, makeup, resit, and enquiry scenarios
2. **Flexible Scheduling**: Supports both bundled and independent exam scheduling
3. **Automatic Generation**: Reduces manual work while maintaining flexibility
4. **Audit Trail**: Complete history of exam attempts, results, and challenges
5. **Revenue Tracking**: Clear pricing and product association for all exam services
6. **Scalable**: Easy to add new exam types or modify existing rules

## Migration Strategy

1. **Phase 1**: Create new exam tables alongside existing system
2. **Phase 2**: Build exam template auto-generation for new courses
3. **Phase 3**: Implement exam session management UI
4. **Phase 4**: Add student-facing exam scheduling interface
5. **Phase 5**: Build enquiry and resit workflow
6. **Phase 6**: Migrate existing exam data and deprecate old system

This architecture provides the foundation for a comprehensive exam management system that handles WSET's complex requirements while maintaining the flexibility needed for future expansion.