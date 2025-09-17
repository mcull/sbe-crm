// WSET Order Processor
// Converts Squarespace orders into WSET workflow candidates and exam orders

import { createClient } from '@/lib/supabase/server'
import { SquarespaceOrder, WSETCandidate, WSET_CONFIG } from './types'
import { validateWSETDeadlines } from './deadline-validator'

export interface OrderProcessingResult {
  success: boolean
  candidateId?: string
  workflowStateId?: string
  error?: string
  warnings?: string[]
}

/**
 * Extract course information from Squarespace order line items
 */
function extractCourseInfo(order: SquarespaceOrder): {
  courseType: string
  courseLevel: 1 | 2 | 3 | 4
  examType: 'PDF' | 'RI'
} | null {
  // Look for WSET course in line items
  for (const item of order.lineItems) {
    const productName = item.productName.toLowerCase()

    // Extract WSET level
    let courseLevel: 1 | 2 | 3 | 4 = 1
    if (productName.includes('level 2') || productName.includes('l2')) {
      courseLevel = 2
    } else if (productName.includes('level 3') || productName.includes('l3')) {
      courseLevel = 3
    } else if (productName.includes('level 4') || productName.includes('l4') || productName.includes('diploma')) {
      courseLevel = 4
    }

    // Determine exam type based on product name or form submission
    let examType: 'PDF' | 'RI' = 'PDF' // Default to in-person
    if (productName.includes('online') || productName.includes('remote') || productName.includes('ri')) {
      examType = 'RI'
    }

    // Check form submission for exam type preference
    if (order.formSubmission?.courseType) {
      const submissionType = order.formSubmission.courseType.toLowerCase()
      if (submissionType.includes('remote') || submissionType.includes('online')) {
        examType = 'RI'
      }
    }

    return {
      courseType: item.productName,
      courseLevel,
      examType
    }
  }

  return null
}

/**
 * Create full address string from Squarespace address object
 */
function formatAddress(address: any): string {
  const parts = [
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.postalCode,
    address.countryCode
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Parse exam date from order data or form submission
 */
function parseExamDate(order: SquarespaceOrder): Date | null {
  // First try form submission
  if (order.formSubmission?.examDate) {
    const date = new Date(order.formSubmission.examDate)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Try to extract from product name or order details
  // This might need customization based on how Squarespace is set up

  // Default to 8 weeks from order date for Level 1
  const orderDate = new Date(order.createdOn)
  const defaultExamDate = new Date(orderDate)
  defaultExamDate.setDate(orderDate.getDate() + 56) // 8 weeks

  return defaultExamDate
}

/**
 * Generate systematic reference number for WSET exam order
 */
function generateReferenceNumber(
  courseLevel: number,
  examDate: Date,
  instructor: string = 'Default'
): string {
  const levelCode = `L${courseLevel}W`
  const dateString = examDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).replace(/ /g, '')

  // Extract instructor initials or use default
  const instructorCode = instructor
    .split(' ')
    .map(name => name.charAt(0))
    .join('.')

  return `${levelCode}-${instructorCode}-${dateString}-SE Beverage-${WSET_CONFIG.APP_INFO.number}`
}

/**
 * Main order processing function
 */
export async function processSquarespaceOrder(
  orderData: SquarespaceOrder
): Promise<OrderProcessingResult> {
  const supabase = await createClient()
  const warnings: string[] = []

  try {
    console.log(`🔄 Processing Squarespace order: ${orderData.orderNumber}`)

    // Extract course information
    const courseInfo = extractCourseInfo(orderData)
    if (!courseInfo) {
      return {
        success: false,
        error: 'Could not determine WSET course information from order'
      }
    }

    // Parse exam date
    const examDate = parseExamDate(orderData)
    if (!examDate) {
      return {
        success: false,
        error: 'Could not determine exam date from order'
      }
    }

    // Validate WSET deadlines
    const deadlineValidation = validateWSETDeadlines(
      examDate,
      courseInfo.examType,
      courseInfo.courseLevel
    )

    if (deadlineValidation.errors.length > 0) {
      return {
        success: false,
        error: `WSET deadline violation: ${deadlineValidation.errors.join(', ')}`
      }
    }

    if (deadlineValidation.warnings.length > 0) {
      warnings.push(...deadlineValidation.warnings)
    }

    // Use billing address, fall back to shipping address
    const address = orderData.billingAddress || orderData.shippingAddress
    if (!address) {
      return {
        success: false,
        error: 'No address information found in order'
      }
    }

    // Check if we already processed this order
    const { data: existingWorkflow } = await supabase
      .from('wset_workflow_states')
      .select('*')
      .eq('squarespace_order_id', orderData.id)
      .single()

    if (existingWorkflow) {
      console.log(`📋 Order ${orderData.orderNumber} already processed`)
      return {
        success: true,
        workflowStateId: existingWorkflow.id,
        warnings: ['Order was already processed']
      }
    }

    // Create or find existing candidate
    let candidateId: string

    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', orderData.customerEmail)
      .single()

    if (existingCandidate) {
      candidateId = existingCandidate.id
      console.log(`👤 Using existing candidate: ${existingCandidate.email}`)
    } else {
      // Create new candidate
      const { data: newCandidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          first_name: address.firstName,
          last_name: address.lastName,
          email: orderData.customerEmail,
          phone: address.phone || null,
          notes: `Created from Squarespace order ${orderData.orderNumber}`
        })
        .select()
        .single()

      if (candidateError) {
        console.error('Failed to create candidate:', candidateError)
        return {
          success: false,
          error: `Failed to create candidate: ${candidateError.message}`
        }
      }

      candidateId = newCandidate.id
      console.log(`👤 Created new candidate: ${newCandidate.email}`)
    }

    // Create WSET candidate record
    const { data: wsetCandidate, error: wsetCandidateError } = await supabase
      .from('wset_candidates')
      .insert({
        candidate_id: candidateId,
        squarespace_order_id: orderData.id,
        order_number: orderData.orderNumber,
        course_type: courseInfo.courseType,
        course_level: courseInfo.courseLevel,
        exam_date: examDate.toISOString().split('T')[0],
        exam_type: courseInfo.examType,
        birthdate: orderData.formSubmission?.birthdate || null,
        gender: orderData.formSubmission?.gender || null,
        full_address: formatAddress(address)
      })
      .select()
      .single()

    if (wsetCandidateError) {
      console.error('Failed to create WSET candidate:', wsetCandidateError)
      return {
        success: false,
        error: `Failed to create WSET candidate: ${wsetCandidateError.message}`
      }
    }

    // Create workflow state
    const { data: workflowState, error: workflowError } = await supabase
      .from('wset_workflow_states')
      .insert({
        squarespace_order_id: orderData.id,
        wset_candidate_id: wsetCandidate.id,
        status: 'received',
        step_order_received: true,
        step_order_received_at: new Date().toISOString(),
        step_candidate_created: true,
        step_candidate_created_at: new Date().toISOString(),
        requires_review: deadlineValidation.workingDaysRemaining <= 5 // Flag for urgent review
      })
      .select()
      .single()

    if (workflowError) {
      console.error('Failed to create workflow state:', workflowError)
      return {
        success: false,
        error: `Failed to create workflow state: ${workflowError.message}`
      }
    }

    console.log(`✅ Successfully processed order ${orderData.orderNumber}`)

    return {
      success: true,
      candidateId,
      workflowStateId: workflowState.id,
      warnings
    }

  } catch (error) {
    console.error('Order processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    }
  }
}

/**
 * Reprocess an existing order (for manual triggers or error recovery)
 */
export async function reprocessOrder(
  squarespaceOrderId: string
): Promise<OrderProcessingResult> {
  const supabase = await createClient()

  try {
    // Get existing workflow state
    const { data: workflowState, error: fetchError } = await supabase
      .from('wset_workflow_states')
      .select('*')
      .eq('squarespace_order_id', squarespaceOrderId)
      .single()

    if (fetchError || !workflowState) {
      return {
        success: false,
        error: 'Workflow state not found for reprocessing'
      }
    }

    // Reset error state
    await supabase
      .from('wset_workflow_states')
      .update({
        status: 'processing',
        error_count: 0,
        last_error: null,
        last_error_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowState.id)

    return {
      success: true,
      workflowStateId: workflowState.id,
      warnings: ['Order reprocessing initiated']
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reprocessing error'
    }
  }
}