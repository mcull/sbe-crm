// WSET Workflow Logger
// Comprehensive logging system for workflow actions and audit trail

import { createClient } from '@/lib/supabase/server'

export interface WorkflowLogEntry {
  workflowStateId: string
  examOrderId?: string
  action: string
  details?: Record<string, any>
  performedBy?: string
  automated?: boolean
}

/**
 * Log a workflow action for audit trail and debugging
 */
export async function logWorkflowAction(entry: WorkflowLogEntry): Promise<void> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('wset_workflow_logs')
      .insert({
        workflow_state_id: entry.workflowStateId,
        exam_order_id: entry.examOrderId || null,
        action: entry.action,
        details: entry.details || {},
        performed_by: entry.performedBy || null,
        automated: entry.automated ?? true
      })

    if (error) {
      console.error('Failed to log workflow action:', error)
    }
  } catch (error) {
    console.error('Workflow logging error:', error)
  }
}

/**
 * Update workflow state and log the transition
 */
export async function updateWorkflowState(
  workflowStateId: string,
  updates: {
    status?: string
    step?: string
    stepCompleted?: boolean
    requiresReview?: boolean
    reviewReason?: string
    error?: string
  },
  logEntry?: Partial<WorkflowLogEntry>
): Promise<void> {
  const supabase = await createClient()

  try {
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.status) {
      updateData.status = updates.status
    }

    if (updates.step && updates.stepCompleted !== undefined) {
      updateData[`step_${updates.step}`] = updates.stepCompleted
      updateData[`step_${updates.step}_at`] = updates.stepCompleted
        ? new Date().toISOString()
        : null
    }

    if (updates.requiresReview !== undefined) {
      updateData.requires_review = updates.requiresReview
      updateData.review_reason = updates.reviewReason || null
    }

    if (updates.error) {
      updateData.error_count = supabase.raw('error_count + 1')
      updateData.last_error = updates.error
      updateData.last_error_at = new Date().toISOString()
    }

    // Update workflow state
    const { error: updateError } = await supabase
      .from('wset_workflow_states')
      .update(updateData)
      .eq('id', workflowStateId)

    if (updateError) {
      console.error('Failed to update workflow state:', updateError)
      return
    }

    // Log the action
    if (logEntry) {
      await logWorkflowAction({
        workflowStateId,
        ...logEntry
      })
    }

  } catch (error) {
    console.error('Workflow state update error:', error)
  }
}

/**
 * Get workflow logs for a specific workflow state
 */
export async function getWorkflowLogs(
  workflowStateId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('wset_workflow_logs')
      .select(`
        *,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .eq('workflow_state_id', workflowStateId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get workflow logs:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('Workflow logs fetch error:', error)
    return []
  }
}

/**
 * Get recent workflow activity across all workflows
 */
export async function getRecentWorkflowActivity(
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('wset_workflow_logs')
      .select(`
        *,
        wset_workflow_states (
          squarespace_order_id,
          status
        ),
        users (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get recent activity:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('Recent activity fetch error:', error)
    return []
  }
}

/**
 * Common workflow actions for consistent logging
 */
export const WorkflowActions = {
  // Order processing
  SQUARESPACE_ORDER_RECEIVED: 'squarespace_order_received',
  CANDIDATE_CREATED: 'candidate_created',
  CANDIDATE_UPDATED: 'candidate_updated',

  // Form generation
  FORMS_GENERATION_STARTED: 'forms_generation_started',
  EXAM_ORDER_FORM_GENERATED: 'exam_order_form_generated',
  CANDIDATE_REGISTRATION_GENERATED: 'candidate_registration_generated',
  FORMS_GENERATION_COMPLETED: 'forms_generation_completed',

  // WSET submission
  WSET_SUBMISSION_STARTED: 'wset_submission_started',
  WSET_EMAIL_SENT: 'wset_email_sent',
  WSET_CONFIRMATION_RECEIVED: 'wset_confirmation_received',

  // Result processing
  WSET_RESULTS_RECEIVED: 'wset_results_received',
  CERTIFICATES_EXTRACTED: 'certificates_extracted',
  STUDENT_RESULTS_SENT: 'student_results_sent',

  // Manual actions
  MANUAL_REVIEW_STARTED: 'manual_review_started',
  MANUAL_REVIEW_COMPLETED: 'manual_review_completed',
  MANUAL_FORM_EDIT: 'manual_form_edit',
  MANUAL_RESUBMISSION: 'manual_resubmission',

  // Errors and recovery
  PROCESSING_ERROR: 'processing_error',
  ERROR_RESOLVED: 'error_resolved',
  WORKFLOW_RESTARTED: 'workflow_restarted',

  // System
  DEADLINE_WARNING: 'deadline_warning',
  COMPLIANCE_CHECK: 'compliance_check'
} as const

/**
 * Create standardized log entries for common actions
 */
export function createLogEntry(
  action: keyof typeof WorkflowActions,
  workflowStateId: string,
  details?: Record<string, any>,
  options?: {
    examOrderId?: string
    performedBy?: string
    automated?: boolean
  }
): WorkflowLogEntry {
  return {
    workflowStateId,
    examOrderId: options?.examOrderId,
    action: WorkflowActions[action],
    details: details || {},
    performedBy: options?.performedBy,
    automated: options?.automated ?? true
  }
}