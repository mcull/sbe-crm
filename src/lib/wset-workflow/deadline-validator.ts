// WSET Deadline Validation Service
// Enforces critical WSET submission deadlines based on workflow analysis

import { WSET_CONFIG } from './types'

export interface DeadlineValidation {
  examDate: Date
  examType: 'PDF' | 'RI'
  level: 1 | 2 | 3 | 4
  submissionDeadline: Date
  workingDaysRemaining: number
  isCompliant: boolean
  canSubmitLate: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Calculate working days between two dates (excluding weekends)
 * Does not account for holidays - WSET uses working days only
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workingDays
}

/**
 * Add working days to a date (excluding weekends)
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()

    // Only count weekdays
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return result
}

/**
 * Validate WSET submission deadlines for an exam
 */
export function validateWSETDeadlines(
  examDate: Date,
  examType: 'PDF' | 'RI',
  level: 1 | 2 | 3 | 4,
  currentDate: Date = new Date()
): DeadlineValidation {
  const warnings: string[] = []
  const errors: string[] = []

  // Determine required working days based on exam type
  const requiredWorkingDays = examType === 'PDF'
    ? WSET_CONFIG.DEADLINES.PDF_EXAM_DAYS
    : WSET_CONFIG.DEADLINES.RI_EXAM_DAYS

  // Calculate submission deadline (working backwards from exam date)
  const submissionDeadline = addWorkingDays(
    new Date(examDate.getTime() - (requiredWorkingDays + 1) * 24 * 60 * 60 * 1000),
    -requiredWorkingDays
  )

  // Calculate working days remaining
  const workingDaysRemaining = calculateWorkingDays(currentDate, submissionDeadline)

  // Check if we're still within the deadline
  const isCompliant = currentDate <= submissionDeadline

  // Level 1 PDF exams can be submitted late (up to 2 working days before exam)
  const canSubmitLate = level === 1 && examType === 'PDF' && !isCompliant

  if (canSubmitLate) {
    const lateDeadline = addWorkingDays(
      new Date(examDate.getTime() - (WSET_CONFIG.DEADLINES.LEVEL_1_LATE_DAYS + 1) * 24 * 60 * 60 * 1000),
      -WSET_CONFIG.DEADLINES.LEVEL_1_LATE_DAYS
    )

    const workingDaysUntilExam = calculateWorkingDays(currentDate, examDate)

    if (currentDate <= lateDeadline) {
      warnings.push(`Level 1 late submission allowed - must be submitted ${WSET_CONFIG.DEADLINES.LEVEL_1_LATE_DAYS} working days before exam`)
    } else {
      errors.push(`Even Level 1 late submission deadline has passed. Cannot submit exam.`)
    }
  }

  // Add warnings based on time remaining
  if (isCompliant) {
    if (workingDaysRemaining <= 2) {
      warnings.push('Very close to WSET deadline - urgent submission required')
    } else if (workingDaysRemaining <= 5) {
      warnings.push('Approaching WSET deadline - submission recommended soon')
    }
  } else if (!canSubmitLate) {
    errors.push(`WSET deadline has passed. ${examType} exams require ${requiredWorkingDays} working days notice.`)
  }

  // Add specific warnings for exam types
  if (examType === 'RI') {
    warnings.push('Remote Invigilation exam - ensure technical requirements are confirmed')
  }

  if (level >= 3) {
    warnings.push('Advanced level exam - verify all candidate prerequisites are met')
  }

  return {
    examDate,
    examType,
    level,
    submissionDeadline,
    workingDaysRemaining: Math.max(0, workingDaysRemaining),
    isCompliant,
    canSubmitLate,
    warnings,
    errors
  }
}

/**
 * Check if an exam can be submitted today
 */
export function canSubmitExamToday(
  examDate: Date,
  examType: 'PDF' | 'RI',
  level: 1 | 2 | 3 | 4,
  currentDate: Date = new Date()
): boolean {
  const validation = validateWSETDeadlines(examDate, examType, level, currentDate)
  return validation.isCompliant || validation.canSubmitLate
}

/**
 * Get next available submission date for an exam
 */
export function getNextSubmissionDate(
  examDate: Date,
  examType: 'PDF' | 'RI',
  level: 1 | 2 | 3 | 4
): Date | null {
  const requiredWorkingDays = examType === 'PDF'
    ? WSET_CONFIG.DEADLINES.PDF_EXAM_DAYS
    : WSET_CONFIG.DEADLINES.RI_EXAM_DAYS

  // Calculate the latest possible submission date
  const latestSubmissionDate = new Date(examDate)
  latestSubmissionDate.setDate(latestSubmissionDate.getDate() - requiredWorkingDays)

  // For Level 1 PDF, we can submit later
  if (level === 1 && examType === 'PDF') {
    const lateSubmissionDate = new Date(examDate)
    lateSubmissionDate.setDate(lateSubmissionDate.getDate() - WSET_CONFIG.DEADLINES.LEVEL_1_LATE_DAYS)
    return lateSubmissionDate
  }

  // If the exam date has passed, we can't submit
  if (new Date() > latestSubmissionDate) {
    return null
  }

  return latestSubmissionDate
}

/**
 * Generate deadline summary for dashboard display
 */
export function generateDeadlineSummary(validations: DeadlineValidation[]): {
  urgent: DeadlineValidation[]
  warning: DeadlineValidation[]
  compliant: DeadlineValidation[]
  overdue: DeadlineValidation[]
} {
  return validations.reduce((acc, validation) => {
    if (validation.errors.length > 0) {
      acc.overdue.push(validation)
    } else if (validation.workingDaysRemaining <= 2) {
      acc.urgent.push(validation)
    } else if (validation.workingDaysRemaining <= 5 || validation.warnings.length > 0) {
      acc.warning.push(validation)
    } else {
      acc.compliant.push(validation)
    }
    return acc
  }, {
    urgent: [] as DeadlineValidation[],
    warning: [] as DeadlineValidation[],
    compliant: [] as DeadlineValidation[],
    overdue: [] as DeadlineValidation[]
  })
}