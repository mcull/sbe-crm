// Squarespace Webhook Handler
// Processes incoming course orders and triggers WSET workflow automation

import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'
import { processSquarespaceOrder } from '@/lib/wset-workflow/order-processor'
import { logWorkflowAction } from '@/lib/wset-workflow/workflow-logger'

// Webhook security - verify requests are from Squarespace
function verifySquarespaceWebhook(request: NextRequest, _body: string): boolean {
  // TODO: Implement Squarespace webhook signature verification
  // This should verify the X-Squarespace-Signature header
  const signature = request.headers.get('x-squarespace-signature')

  if (!signature) {
    console.warn('Missing Squarespace signature header')
    return false
  }

  // For now, we'll accept all requests in development
  // In production, implement proper signature verification
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const data = JSON.parse(body)

    console.log('🔔 Squarespace webhook received:', {
      topic: data.topic,
      orderId: data.data?.id,
      timestamp: new Date().toISOString()
    })

    // Verify webhook authenticity
    if (!verifySquarespaceWebhook(request, body)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Only process order completion events
    if (data.topic !== 'order.create' && data.topic !== 'order.update') {
      console.log(`📋 Ignoring webhook topic: ${data.topic}`)
      return NextResponse.json({ message: 'Webhook received but not processed' })
    }

    const orderData = data.data

    // Basic validation
    if (!orderData || !orderData.id) {
      console.error('❌ Invalid order data received')
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Check if this is a WSET course order
    const isWSETOrder = orderData.lineItems?.some((item: { productName?: string }) =>
      item.productName?.toLowerCase().includes('wset') ||
      item.productName?.toLowerCase().includes('wine') ||
      item.productName?.toLowerCase().includes('level')
    )

    if (!isWSETOrder) {
      console.log(`📦 Order ${orderData.orderNumber} is not a WSET course - skipping`)
      return NextResponse.json({ message: 'Non-WSET order ignored' })
    }

    console.log(`🍷 Processing WSET order: ${orderData.orderNumber}`)

    // Process the order through our WSET workflow
    const result = await processSquarespaceOrder(orderData)

    if (result.success) {
      console.log(`✅ WSET order processed successfully:`, {
        orderId: orderData.id,
        workflowStateId: result.workflowStateId,
        candidateId: result.candidateId
      })

      // Log successful processing
      await logWorkflowAction({
        workflowStateId: result.workflowStateId!,
        action: 'squarespace_order_received',
        details: {
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.customerEmail
        },
        automated: true
      })

      return NextResponse.json({
        success: true,
        message: 'WSET order processed successfully',
        workflowStateId: result.workflowStateId,
        candidateId: result.candidateId
      })
    } else {
      console.error(`❌ Failed to process WSET order:`, result.error)

      // Log processing error
      if (result.workflowStateId) {
        await logWorkflowAction({
          workflowStateId: result.workflowStateId,
          action: 'processing_error',
          details: {
            error: result.error,
            orderId: orderData.id
          },
          automated: true
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET(_request: NextRequest) {
  // Some webhook services send GET requests to verify endpoints
  return NextResponse.json({
    message: 'SBE CRM Squarespace Webhook Endpoint',
    timestamp: new Date().toISOString(),
    status: 'active'
  })
}

// Webhook endpoint information for setup
export const metadata = {
  endpoint: '/api/webhooks/squarespace',
  methods: ['POST', 'GET'],
  description: 'Processes Squarespace order webhooks for WSET course automation',
  requiredHeaders: ['x-squarespace-signature'],
  supportedEvents: ['order.create', 'order.update']
}