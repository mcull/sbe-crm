// Comprehensive TypeScript types for WSET Exam Management System

export type ExamType = 'theory' | 'tasting' | 'combined'

export type BundledTiming = 'same_day' | 'final_day' | 'separate_day'

export type SessionType = 'bundled' | 'makeup' | 'resit' | 'remote_invigilation' | 'standalone'

export type RegistrationType = 'bundled' | 'makeup' | 'resit' | 'remote_invigilation' | 'standalone'

export type ExamSessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type RegistrationStatus = 'registered' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled'

export type EnquiryType = 'theory' | 'tasting' | 'both'

export type EnquiryStatus = 'submitted' | 'payment_pending' | 'under_review' | 'completed' | 'rejected' | 'withdrawn'

export type EnquiryOutcome = 'upheld' | 'rejected' | 'partial'

// =============================================
// EXAM TEMPLATES
// =============================================

export interface ExamTemplate {
  id: string
  course_offering_id: string

  // Template identification
  name: string
  exam_type: ExamType

  // Exam specifications
  duration_minutes: number
  pass_mark_percentage: number
  max_score: number

  // Bundling configuration
  is_bundled_with_course: boolean
  bundled_timing?: BundledTiming

  // Scheduling rules
  can_schedule_independently: boolean
  scheduling_window_days: number

  // Exam services availability
  allows_resits: boolean
  allows_enquiries: boolean

  // Pricing for standalone bookings
  makeup_fee: number
  resit_fee: number
  remote_invigilation_fee: number
  enquiry_fee: number

  // Status and metadata
  active: boolean
  metadata: Record<string, any>

  // Audit trail
  created_at: string
  updated_at: string

  // Relations
  course_offering?: {
    id: string
    name: string
    type: string
    wset_level?: number
    metadata?: Record<string, any>
  }
  exam_sessions?: ExamSession[]
}

export interface CreateExamTemplateData {
  course_offering_id: string
  name: string
  exam_type: ExamType
  duration_minutes: number
  pass_mark_percentage?: number
  max_score?: number
  is_bundled_with_course?: boolean
  bundled_timing?: BundledTiming
  can_schedule_independently?: boolean
  scheduling_window_days?: number
  allows_resits?: boolean
  allows_enquiries?: boolean
  makeup_fee?: number
  resit_fee?: number
  remote_invigilation_fee?: number
  enquiry_fee?: number
  active?: boolean
  metadata?: Record<string, any>
}

export interface UpdateExamTemplateData extends Partial<CreateExamTemplateData> {
  id?: never // Prevent id updates
}

// =============================================
// EXAM SESSIONS
// =============================================

export interface ExamSession {
  id: string
  exam_template_id: string
  course_session_id?: string

  // Session identification
  name?: string
  description?: string

  // Scheduling details
  exam_date: string
  exam_end_time?: string
  location?: string
  proctor?: string
  delivery_method: 'in_person' | 'online' | 'hybrid'

  // Capacity management
  max_capacity: number
  current_enrollment: number
  available_spots: number

  // Session classification
  session_type: SessionType

  // Booking configuration
  booking_enabled: boolean
  registration_deadline?: string

  // Auto-generated commerce
  product_id?: string

  // Status tracking
  status: ExamSessionStatus

  // Metadata and audit
  metadata: Record<string, any>
  created_at: string
  updated_at: string

  // Relations
  exam_template?: ExamTemplate
  course_session?: {
    id: string
    name?: string
    session_date: string
    location?: string
    offerings?: {
      id: string
      name: string
      wset_level?: number
    }
  }
  product?: {
    id: string
    name: string
    base_price: number
    stripe_product_id?: string
  }
  exam_registrations?: ExamRegistration[]
}

export interface CreateExamSessionData {
  exam_template_id: string
  course_session_id?: string
  name?: string
  description?: string
  exam_date: string
  exam_end_time?: string
  location?: string
  proctor?: string
  delivery_method?: 'in_person' | 'online' | 'hybrid'
  max_capacity: number
  session_type: SessionType
  booking_enabled?: boolean
  registration_deadline?: string
  metadata?: Record<string, any>
}

export interface UpdateExamSessionData extends Partial<CreateExamSessionData> {
  id?: never
  status?: ExamSessionStatus
}

// =============================================
// EXAM REGISTRATIONS
// =============================================

export interface ExamRegistration {
  id: string
  candidate_id: string
  exam_session_id: string
  course_enrollment_id?: string

  // Registration metadata
  registration_type: RegistrationType
  registration_date: string

  // Payment tracking
  fee_amount: number
  fee_paid: boolean
  payment_method?: string
  stripe_payment_intent_id?: string

  // Exam attempt tracking
  attempt_number: number
  is_makeup: boolean
  is_resit: boolean

  // Status management
  status: RegistrationStatus

  // Results (supporting Level 3's dual components)
  theory_score?: number
  theory_passed?: boolean
  tasting_score?: number
  tasting_passed?: boolean
  overall_score?: number
  overall_passed?: boolean

  // Result metadata
  result_date?: string
  result_entered_by?: string
  result_notes?: string

  // Audit trail
  created_at: string
  updated_at: string

  // Relations
  candidate?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  exam_session?: ExamSession
  course_enrollment?: {
    id: string
    course_start_date: string
    exam_eligibility_expires_at?: string
    status: string
  }
  exam_enquiries?: ExamEnquiry[]
}

export interface CreateExamRegistrationData {
  candidate_id: string
  exam_session_id: string
  course_enrollment_id?: string
  registration_type: RegistrationType
  fee_amount?: number
  fee_paid?: boolean
  payment_method?: string
  stripe_payment_intent_id?: string
  attempt_number?: number
  is_makeup?: boolean
  is_resit?: boolean
}

export interface UpdateExamRegistrationData {
  status?: RegistrationStatus
  theory_score?: number
  theory_passed?: boolean
  tasting_score?: number
  tasting_passed?: boolean
  overall_score?: number
  overall_passed?: boolean
  result_date?: string
  result_entered_by?: string
  result_notes?: string
}

// =============================================
// EXAM ENQUIRIES
// =============================================

export interface ExamEnquiry {
  id: string
  exam_registration_id: string
  candidate_id: string

  // Enquiry details
  enquiry_type: EnquiryType
  reason: string
  supporting_evidence?: string

  // Fee management
  enquiry_fee: number
  fee_paid: boolean
  fee_refunded: boolean
  stripe_payment_intent_id?: string

  // Workflow status
  status: EnquiryStatus

  // Review process
  reviewed_by?: string
  review_date?: string
  review_notes?: string

  // Outcome
  outcome?: EnquiryOutcome
  score_change_theory?: number
  score_change_tasting?: number
  result_changed: boolean

  // Notifications
  student_notified: boolean
  notification_sent_at?: string

  // Audit trail
  created_at: string
  updated_at: string

  // Relations
  exam_registration?: ExamRegistration
  candidate?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  reviewer?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}

export interface CreateExamEnquiryData {
  exam_registration_id: string
  candidate_id: string
  enquiry_type: EnquiryType
  reason: string
  supporting_evidence?: string
  enquiry_fee: number
  stripe_payment_intent_id?: string
}

export interface UpdateExamEnquiryData {
  status?: EnquiryStatus
  reviewed_by?: string
  review_date?: string
  review_notes?: string
  outcome?: EnquiryOutcome
  score_change_theory?: number
  score_change_tasting?: number
  result_changed?: boolean
  student_notified?: boolean
  notification_sent_at?: string
  fee_refunded?: boolean
}

// =============================================
// HELPER TYPES
// =============================================

// For exam scheduling interfaces
export interface ExamSchedulingOption {
  exam_template: ExamTemplate
  available_sessions: ExamSession[]
  pricing: {
    bundled: boolean
    makeup_fee?: number
    resit_fee?: number
    remote_invigilation_fee?: number
  }
  eligibility: {
    can_schedule: boolean
    window_expires?: string
    reasons?: string[]
  }
}

// For exam results entry
export interface ExamResultsEntry {
  registration_id: string
  exam_type: ExamType
  theory_score?: number
  tasting_score?: number
  pass_marks: {
    theory?: number
    tasting?: number
  }
  notes?: string
}

// For exam statistics and reporting
export interface ExamStatistics {
  total_sessions: number
  upcoming_sessions: number
  completed_sessions: number
  total_registrations: number
  completed_registrations: number
  pass_rate: number
  average_scores: {
    theory?: number
    tasting?: number
    overall?: number
  }
  by_level: Record<string, {
    sessions: number
    registrations: number
    pass_rate: number
  }>
}

// For exam calendar views
export interface ExamCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  type: SessionType
  location?: string
  capacity: number
  enrolled: number
  exam_template: {
    name: string
    exam_type: ExamType
  }
  course_session?: {
    name?: string
    offering_name: string
  }
}

// API response types
export interface ExamApiResponse<T = any> {
  data: T
  success: boolean
  error?: string
  message?: string
}

export interface PaginatedExamResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  success: boolean
  error?: string
}