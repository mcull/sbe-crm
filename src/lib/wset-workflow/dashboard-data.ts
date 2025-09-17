// WSET Workflow Dashboard Data Service
// Aggregates data for the workflow monitoring dashboard

import { createClient } from '@/lib/supabase/server'
import { validateWSETDeadlines } from './deadline-validator'
import { getRecentWorkflowActivity } from './workflow-logger'

export interface WorkflowDashboardData {
  workflowStates: any[]
  deadlineValidations: any[]
  recentActivity: any[]
  statistics: {
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    errorWorkflows: number
    urgentDeadlines: number
    overdueSubmissions: number
  }
}

/**
 * Get comprehensive dashboard data for WSET workflow monitoring
 */
export async function getWorkflowDashboardData(): Promise<WorkflowDashboardData> {
  const supabase = await createClient()

  try {
    // Get all workflow states with related data
    const { data: workflowStates, error: workflowError } = await supabase
      .from('wset_workflow_states')
      .select(`
        *,
        wset_candidates (
          *,
          candidates (
            first_name,
            last_name,
            email
          )
        ),
        wset_exam_orders (
          id,
          reference_number,
          status,
          exam_date,
          exam_type,
          course_level
        )
      `)
      .order('created_at', { ascending: false })

    if (workflowError) {
      console.error('Failed to fetch workflow states:', workflowError)
      throw workflowError
    }

    // Get recent activity
    const recentActivity = await getRecentWorkflowActivity(50)

    // Calculate deadline validations for active workflows
    const deadlineValidations = []
    const today = new Date()

    for (const workflow of workflowStates || []) {
      if (workflow.wset_candidates && !['completed', 'error'].includes(workflow.status)) {
        const candidate = workflow.wset_candidates

        try {
          const examDate = new Date(candidate.exam_date)
          const validation = validateWSETDeadlines(
            examDate,
            candidate.exam_type as 'PDF' | 'RI',
            candidate.course_level as 1 | 2 | 3 | 4,
            today
          )

          deadlineValidations.push({
            ...validation,
            workflowStateId: workflow.id,
            candidateName: workflow.wset_candidates.candidates ?
              `${workflow.wset_candidates.candidates.first_name} ${workflow.wset_candidates.candidates.last_name}` :
              'Unknown',
            orderNumber: candidate.order_number,
            courseType: candidate.course_type
          })
        } catch (error) {
          console.error(`Failed to validate deadline for workflow ${workflow.id}:`, error)
        }
      }
    }

    // Calculate statistics
    const statistics = {
      totalWorkflows: workflowStates?.length || 0,
      activeWorkflows: workflowStates?.filter(w =>
        !['completed', 'error'].includes(w.status)
      ).length || 0,
      completedWorkflows: workflowStates?.filter(w =>
        w.status === 'completed'
      ).length || 0,
      errorWorkflows: workflowStates?.filter(w =>
        w.status === 'error' || w.error_count > 0
      ).length || 0,
      urgentDeadlines: deadlineValidations.filter(v =>
        v.workingDaysRemaining <= 2 && v.errors.length === 0
      ).length,
      overdueSubmissions: deadlineValidations.filter(v =>
        v.errors.length > 0
      ).length
    }

    return {
      workflowStates: workflowStates || [],
      deadlineValidations,
      recentActivity: recentActivity || [],
      statistics
    }

  } catch (error) {
    console.error('Dashboard data fetch error:', error)

    // Return empty data structure on error
    return {
      workflowStates: [],
      deadlineValidations: [],
      recentActivity: [],
      statistics: {
        totalWorkflows: 0,
        activeWorkflows: 0,
        completedWorkflows: 0,
        errorWorkflows: 0,
        urgentDeadlines: 0,
        overdueSubmissions: 0
      }
    }
  }
}

/**
 * Get workflow states that require manual review
 */
export async function getWorkflowsRequiringReview() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('wset_workflow_states')
      .select(`
        *,
        wset_candidates (
          *,
          candidates (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('requires_review', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch workflows requiring review:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('Review workflows fetch error:', error)
    return []
  }
}

/**
 * Get workflows by status
 */
export async function getWorkflowsByStatus(status: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('wset_workflow_states')
      .select(`
        *,
        wset_candidates (
          *,
          candidates (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Failed to fetch workflows with status ${status}:`, error)
      return []
    }

    return data || []

  } catch (error) {
    console.error(`Status workflows fetch error for ${status}:`, error)
    return []
  }
}

/**
 * Get workflow statistics for a specific time period
 */
export async function getWorkflowStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  ordersReceived: number
  formsGenerated: number
  submissionsCompleted: number
  averageProcessingTime: number
  errorRate: number
}> {
  const supabase = await createClient()

  try {
    const { data: workflows, error } = await supabase
      .from('wset_workflow_states')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) {
      console.error('Failed to fetch workflow statistics:', error)
      return {
        ordersReceived: 0,
        formsGenerated: 0,
        submissionsCompleted: 0,
        averageProcessingTime: 0,
        errorRate: 0
      }
    }

    const stats = workflows?.reduce((acc, workflow) => {
      acc.ordersReceived++

      if (workflow.step_forms_generated) {
        acc.formsGenerated++
      }

      if (workflow.step_wset_submitted) {
        acc.submissionsCompleted++
      }

      if (workflow.error_count > 0) {
        acc.errors++
      }

      // Calculate processing time for completed workflows
      if (workflow.status === 'completed' && workflow.step_wset_submitted_at) {
        const processingTime = new Date(workflow.step_wset_submitted_at).getTime() -
                              new Date(workflow.created_at).getTime()
        acc.totalProcessingTime += processingTime
        acc.completedCount++
      }

      return acc
    }, {
      ordersReceived: 0,
      formsGenerated: 0,
      submissionsCompleted: 0,
      errors: 0,
      totalProcessingTime: 0,
      completedCount: 0
    }) || {
      ordersReceived: 0,
      formsGenerated: 0,
      submissionsCompleted: 0,
      errors: 0,
      totalProcessingTime: 0,
      completedCount: 0
    }

    return {
      ordersReceived: stats.ordersReceived,
      formsGenerated: stats.formsGenerated,
      submissionsCompleted: stats.submissionsCompleted,
      averageProcessingTime: stats.completedCount > 0 ?
        Math.round(stats.totalProcessingTime / stats.completedCount / (1000 * 60 * 60)) : 0, // in hours
      errorRate: stats.ordersReceived > 0 ?
        Math.round((stats.errors / stats.ordersReceived) * 100) : 0 // as percentage
    }

  } catch (error) {
    console.error('Statistics calculation error:', error)
    return {
      ordersReceived: 0,
      formsGenerated: 0,
      submissionsCompleted: 0,
      averageProcessingTime: 0,
      errorRate: 0
    }
  }
}