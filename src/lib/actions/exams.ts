'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  ExamTemplate,
  ExamSession,
  ExamRegistration,
  ExamEnquiry,
  CreateExamTemplateData,
  UpdateExamTemplateData,
  CreateExamSessionData,
  UpdateExamSessionData,
  CreateExamRegistrationData,
  UpdateExamRegistrationData,
  CreateExamEnquiryData,
  UpdateExamEnquiryData,
  ExamSchedulingOption,
  ExamStatistics,
  SessionType,
  RegistrationType
} from '@/lib/types/exams'

// =============================================
// EXAM TEMPLATES
// =============================================

export async function getExamTemplates(courseOfferingId?: string): Promise<ExamTemplate[]> {
  const supabase = await createClient()

  let query = supabase
    .from('exam_templates')
    .select(`
      *,
      course_offering:offerings (
        id,
        name,
        type,
        wset_level,
        metadata
      )
    `)
    .eq('active', true)
    .order('course_offering_id', { ascending: true })
    .order('exam_type', { ascending: true })

  if (courseOfferingId) {
    query = query.eq('course_offering_id', courseOfferingId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch exam templates: ${error.message}`)
  }

  return data || []
}

export async function getExamTemplate(id: string): Promise<ExamTemplate> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exam_templates')
    .select(`
      *,
      course_offering:offerings (
        id,
        name,
        type,
        wset_level,
        metadata
      ),
      exam_sessions (
        id,
        name,
        exam_date,
        session_type,
        status,
        current_enrollment,
        max_capacity
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exam template: ${error.message}`)
  }

  return data
}

export async function createExamTemplate(data: CreateExamTemplateData): Promise<ExamTemplate> {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('exam_templates')
    .insert(data)
    .select(`
      *,
      course_offering:offerings (
        id,
        name,
        type,
        wset_level
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create exam template: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return template
}

export async function updateExamTemplate(id: string, data: UpdateExamTemplateData): Promise<ExamTemplate> {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('exam_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      course_offering:offerings (
        id,
        name,
        type,
        wset_level
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update exam template: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return template
}

// =============================================
// EXAM SESSIONS
// =============================================

export async function getExamSessions(options: {
  examTemplateId?: string
  courseSessionId?: string
  sessionType?: SessionType
  upcoming?: boolean
  limit?: number
} = {}): Promise<ExamSession[]> {
  const supabase = await createClient()

  let query = supabase
    .from('exam_sessions')
    .select(`
      *,
      exam_template:exam_templates (
        id,
        name,
        exam_type,
        duration_minutes,
        pass_mark_percentage,
        course_offering:offerings (
          id,
          name,
          wset_level
        )
      ),
      course_session:sessions (
        id,
        name,
        session_date,
        location,
        offerings (
          id,
          name,
          wset_level
        )
      ),
      product:products (
        id,
        name,
        base_price,
        stripe_product_id
      )
    `)
    .order('exam_date', { ascending: true })

  if (options.examTemplateId) {
    query = query.eq('exam_template_id', options.examTemplateId)
  }

  if (options.courseSessionId) {
    query = query.eq('course_session_id', options.courseSessionId)
  }

  if (options.sessionType) {
    query = query.eq('session_type', options.sessionType)
  }

  if (options.upcoming) {
    query = query.gte('exam_date', new Date().toISOString())
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch exam sessions: ${error.message}`)
  }

  return data || []
}

export async function getExamSession(id: string): Promise<ExamSession> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      exam_template:exam_templates (
        *,
        course_offering:offerings (
          id,
          name,
          type,
          wset_level,
          metadata
        )
      ),
      course_session:sessions (
        id,
        name,
        session_date,
        end_date,
        location,
        offerings (
          id,
          name,
          wset_level
        )
      ),
      product:products (
        id,
        name,
        base_price,
        stripe_product_id,
        active
      ),
      exam_registrations (
        id,
        candidate_id,
        registration_type,
        status,
        theory_score,
        theory_passed,
        tasting_score,
        tasting_passed,
        overall_passed,
        created_at,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exam session: ${error.message}`)
  }

  return data
}

export async function createExamSession(data: CreateExamSessionData): Promise<ExamSession> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('exam_sessions')
    .insert(data)
    .select(`
      *,
      exam_template:exam_templates (
        id,
        name,
        exam_type
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create exam session: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return session
}

export async function updateExamSession(id: string, data: UpdateExamSessionData): Promise<ExamSession> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('exam_sessions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      exam_template:exam_templates (
        id,
        name,
        exam_type
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update exam session: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return session
}

// =============================================
// EXAM REGISTRATIONS
// =============================================

export async function getExamRegistrations(options: {
  candidateId?: string
  examSessionId?: string
  registrationType?: RegistrationType
  status?: string
  limit?: number
} = {}): Promise<ExamRegistration[]> {
  const supabase = await createClient()

  let query = supabase
    .from('exam_registrations')
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_session:exam_sessions (
        id,
        name,
        exam_date,
        location,
        session_type,
        exam_template:exam_templates (
          id,
          name,
          exam_type,
          course_offering:offerings (
            id,
            name,
            wset_level
          )
        )
      ),
      course_enrollment:course_enrollments (
        id,
        course_start_date,
        exam_eligibility_expires_at,
        status
      )
    `)
    .order('registration_date', { ascending: false })

  if (options.candidateId) {
    query = query.eq('candidate_id', options.candidateId)
  }

  if (options.examSessionId) {
    query = query.eq('exam_session_id', options.examSessionId)
  }

  if (options.registrationType) {
    query = query.eq('registration_type', options.registrationType)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch exam registrations: ${error.message}`)
  }

  return data || []
}

export async function createExamRegistration(data: CreateExamRegistrationData): Promise<ExamRegistration> {
  const supabase = await createClient()

  const { data: registration, error } = await supabase
    .from('exam_registrations')
    .insert(data)
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_session:exam_sessions (
        id,
        name,
        exam_date,
        exam_template:exam_templates (
          id,
          name,
          exam_type
        )
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create exam registration: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return registration
}

export async function updateExamRegistration(id: string, data: UpdateExamRegistrationData): Promise<ExamRegistration> {
  const supabase = await createClient()

  const { data: registration, error } = await supabase
    .from('exam_registrations')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_session:exam_sessions (
        id,
        name,
        exam_date,
        exam_template:exam_templates (
          id,
          name,
          exam_type
        )
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update exam registration: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return registration
}

// =============================================
// EXAM ENQUIRIES
// =============================================

export async function getExamEnquiries(options: {
  candidateId?: string
  examRegistrationId?: string
  status?: string
  limit?: number
} = {}): Promise<ExamEnquiry[]> {
  const supabase = await createClient()

  let query = supabase
    .from('exam_enquiries')
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_registration:exam_registrations (
        id,
        attempt_number,
        theory_score,
        tasting_score,
        overall_passed,
        exam_session:exam_sessions (
          id,
          name,
          exam_date,
          exam_template:exam_templates (
            id,
            name,
            exam_type,
            course_offering:offerings (
              id,
              name,
              wset_level
            )
          )
        )
      ),
      reviewer:users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (options.candidateId) {
    query = query.eq('candidate_id', options.candidateId)
  }

  if (options.examRegistrationId) {
    query = query.eq('exam_registration_id', options.examRegistrationId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch exam enquiries: ${error.message}`)
  }

  return data || []
}

export async function createExamEnquiry(data: CreateExamEnquiryData): Promise<ExamEnquiry> {
  const supabase = await createClient()

  const { data: enquiry, error } = await supabase
    .from('exam_enquiries')
    .insert(data)
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_registration:exam_registrations (
        id,
        exam_session:exam_sessions (
          id,
          name,
          exam_date,
          exam_template:exam_templates (
            id,
            name,
            exam_type
          )
        )
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create exam enquiry: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return enquiry
}

export async function updateExamEnquiry(id: string, data: UpdateExamEnquiryData): Promise<ExamEnquiry> {
  const supabase = await createClient()

  const { data: enquiry, error } = await supabase
    .from('exam_enquiries')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      candidate:candidates (
        id,
        first_name,
        last_name,
        email
      ),
      exam_registration:exam_registrations (
        id,
        exam_session:exam_sessions (
          id,
          name,
          exam_date,
          exam_template:exam_templates (
            id,
            name,
            exam_type
          )
        )
      ),
      reviewer:users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to update exam enquiry: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  return enquiry
}

// =============================================
// SPECIALIZED QUERIES
// =============================================

export async function getStudentExamSchedulingOptions(candidateId: string, courseOfferingId?: string): Promise<ExamSchedulingOption[]> {
  const supabase = await createClient()

  // Get course enrollments for the student
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      course_offering:offerings (
        id,
        name,
        wset_level,
        exam_templates:exam_templates (
          *
        )
      )
    `)
    .eq('candidate_id', candidateId)
    .eq('status', 'active')
    .gte('exam_eligibility_expires_at', new Date().toISOString())

  if (enrollmentError) {
    throw new Error(`Failed to fetch student enrollments: ${enrollmentError.message}`)
  }

  const options: ExamSchedulingOption[] = []

  for (const enrollment of enrollments || []) {
    if (courseOfferingId && enrollment.course_offering.id !== courseOfferingId) {
      continue
    }

    for (const template of enrollment.course_offering.exam_templates || []) {
      if (!template.can_schedule_independently) {
        continue
      }

      // Get available sessions for this template
      const availableSessions = await getExamSessions({
        examTemplateId: template.id,
        upcoming: true
      })

      options.push({
        exam_template: template,
        available_sessions: availableSessions,
        pricing: {
          bundled: false,
          remote_invigilation_fee: template.remote_invigilation_fee
        },
        eligibility: {
          can_schedule: true,
          window_expires: enrollment.exam_eligibility_expires_at
        }
      })
    }
  }

  return options
}

export async function getExamStatistics(): Promise<ExamStatistics> {
  const supabase = await createClient()

  // Get session statistics
  const { data: sessionStats } = await supabase
    .from('exam_sessions')
    .select('status, exam_template:exam_templates(course_offering:offerings(wset_level))')

  // Get registration statistics
  const { data: registrationStats } = await supabase
    .from('exam_registrations')
    .select(`
      status,
      overall_passed,
      theory_score,
      tasting_score,
      overall_score,
      exam_session:exam_sessions(
        exam_template:exam_templates(
          course_offering:offerings(wset_level)
        )
      )
    `)

  const totalSessions = sessionStats?.length || 0
  const upcomingSessions = sessionStats?.filter(s => s.status === 'scheduled').length || 0
  const completedSessions = sessionStats?.filter(s => s.status === 'completed').length || 0

  const totalRegistrations = registrationStats?.length || 0
  const completedRegistrations = registrationStats?.filter(r => r.status === 'completed').length || 0
  const passedRegistrations = registrationStats?.filter(r => r.overall_passed === true).length || 0

  const passRate = completedRegistrations > 0 ? (passedRegistrations / completedRegistrations) * 100 : 0

  // Calculate average scores
  const completedWithScores = registrationStats?.filter(r =>
    r.status === 'completed' && (r.theory_score || r.tasting_score || r.overall_score)
  ) || []

  const theoryScores = completedWithScores.filter(r => r.theory_score).map(r => r.theory_score!)
  const tastingScores = completedWithScores.filter(r => r.tasting_score).map(r => r.tasting_score!)
  const overallScores = completedWithScores.filter(r => r.overall_score).map(r => r.overall_score!)

  const averageScores = {
    theory: theoryScores.length > 0 ? theoryScores.reduce((sum, score) => sum + score, 0) / theoryScores.length : undefined,
    tasting: tastingScores.length > 0 ? tastingScores.reduce((sum, score) => sum + score, 0) / tastingScores.length : undefined,
    overall: overallScores.length > 0 ? overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length : undefined
  }

  // Calculate by level statistics
  const byLevel: Record<string, any> = {}
  for (let level = 1; level <= 4; level++) {
    const levelSessions = sessionStats?.filter(s =>
      s.exam_template?.course_offering?.wset_level === level
    ) || []

    const levelRegistrations = registrationStats?.filter(r =>
      r.exam_session?.exam_template?.course_offering?.wset_level === level
    ) || []

    const levelCompleted = levelRegistrations.filter(r => r.status === 'completed')
    const levelPassed = levelCompleted.filter(r => r.overall_passed === true)

    byLevel[level.toString()] = {
      sessions: levelSessions.length,
      registrations: levelRegistrations.length,
      pass_rate: levelCompleted.length > 0 ? (levelPassed.length / levelCompleted.length) * 100 : 0
    }
  }

  return {
    total_sessions: totalSessions,
    upcoming_sessions: upcomingSessions,
    completed_sessions: completedSessions,
    total_registrations: totalRegistrations,
    completed_registrations: completedRegistrations,
    pass_rate: passRate,
    average_scores: averageScores,
    by_level: byLevel
  }
}

// Helper function to check student eligibility
export async function checkStudentExamEligibility(candidateId: string, examSessionId: string): Promise<{ eligible: boolean, reasons: string[] }> {
  const supabase = await createClient()

  // Call the database function
  const { data, error } = await supabase
    .rpc('is_student_eligible_for_exam', {
      student_candidate_id: candidateId,
      target_exam_session_id: examSessionId
    })

  if (error) {
    return { eligible: false, reasons: [`Database error: ${error.message}`] }
  }

  return { eligible: data, reasons: data ? [] : ['Student is not eligible for this exam session'] }
}