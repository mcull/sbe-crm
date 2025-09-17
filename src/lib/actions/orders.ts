'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrders() {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        name,
        description,
        quantity,
        unit_price,
        total_price,
        products (
          id,
          name
        )
      ),
      candidates (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return orders || []
}

export async function getOrder(id: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        name,
        description,
        sku,
        quantity,
        unit_price,
        total_price,
        product_snapshot,
        products (
          id,
          name,
          description,
          type
        )
      ),
      candidates (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  return order
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  fulfillmentStatus?: string
) {
  const supabase = await createClient()

  const updateData: any = { status }
  if (fulfillmentStatus) {
    updateData.fulfillment_status = fulfillmentStatus
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

export async function addOrderNote(orderId: string, note: string, isAdminNote: boolean = false) {
  const supabase = await createClient()

  const field = isAdminNote ? 'admin_notes' : 'notes'

  const { error } = await supabase
    .from('orders')
    .update({ [field]: note })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to add note: ${error.message}`)
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

export async function getOrderStats() {
  const supabase = await createClient()

  // Get order counts by status
  const { data: statusStats } = await supabase
    .from('orders')
    .select('status')

  // Get revenue data
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('status', 'paid')

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, total_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = {
    totalOrders: statusStats?.length || 0,
    paidOrders: statusStats?.filter(o => o.status === 'paid').length || 0,
    pendingOrders: statusStats?.filter(o => o.status === 'pending').length || 0,
    totalRevenue: revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    recentOrders: recentOrders || []
  }

  return stats
}