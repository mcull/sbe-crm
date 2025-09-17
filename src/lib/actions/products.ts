'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      course_sessions!inner(
        id,
        start_date,
        end_date,
        available_spots,
        max_capacity,
        base_price
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    // If join fails, try without course_sessions
    const { data: fallbackProducts, error: fallbackError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallbackError) {
      throw new Error(`Failed to fetch products: ${fallbackError.message}`)
    }

    return fallbackProducts || []
  }

  return products || []
}

export async function getProduct(id: string) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      course_sessions (
        id,
        start_date,
        end_date,
        available_spots,
        max_capacity,
        base_price,
        location,
        booking_enabled
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return product
}

export async function updateProduct(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function createProduct(data: any) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  revalidatePath('/dashboard/products')
  return product
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function getProductStats() {
  const supabase = await createClient()

  // Get product counts
  const { data: products } = await supabase
    .from('products')
    .select('active, type')

  // Get order items stats
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      total_price,
      product_id,
      orders!inner(status)
    `)

  const activeProducts = products?.filter(p => p.active).length || 0
  const totalProducts = products?.length || 0

  // Calculate revenue by product type
  const revenue = orderItems?.reduce((acc, item: any) => {
    if (item.orders.status === 'paid') {
      return acc + (item.total_price || 0)
    }
    return acc
  }, 0) || 0

  const topProducts = products?.reduce((acc: any, product) => {
    const productRevenue = orderItems
      ?.filter((item: any) => item.product_id === product.id && item.orders.status === 'paid')
      ?.reduce((sum, item: any) => sum + (item.total_price || 0), 0) || 0

    if (productRevenue > 0) {
      acc.push({
        id: product.id,
        name: product.name,
        revenue: productRevenue
      })
    }
    return acc
  }, [])

  topProducts?.sort((a: any, b: any) => b.revenue - a.revenue)

  return {
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalRevenue: revenue,
    topProducts: topProducts?.slice(0, 5) || []
  }
}