#!/usr/bin/env tsx

/**
 * Historical Data Import Script
 *
 * Imports Squarespace historical data into the new e-commerce system
 * Processes orders.csv and products.csv from public/historical/
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Type definitions for CSV data
interface SquarespaceOrder {
  'Order ID': string
  'Email': string
  'Financial Status': string
  'Paid at': string
  'Fulfillment Status': string
  'Currency': string
  'Subtotal': string
  'Shipping': string
  'Taxes': string
  'Amount Refunded': string
  'Total': string
  'Discount Code': string
  'Discount Amount': string
  'Created at': string
  'Lineitem quantity': string
  'Lineitem name': string
  'Lineitem price': string
  'Lineitem sku': string
  'Billing Name': string
  'Billing Phone': string
  'Billing Address1': string
  'Billing City': string
  'Billing Zip': string
  'Billing Province': string
  'Billing Country': string
  'Payment Reference': string
}

interface SquarespaceProduct {
  'Product ID [Non Editable]': string
  'Title': string
  'Description': string
  'SKU': string
  'Price': string
  'Sale Price': string
  'On Sale': string
  'Stock': string
  'Categories': string
  'Tags': string
  'Visible': string
}

// Utility functions
function parsePrice(priceStr: string): number {
  return parseFloat(priceStr) || 0
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr)
  } catch {
    return null
  }
}

function extractWSETLevel(title: string): number | null {
  const match = title.match(/Level\s+(\d+)/i)
  return match ? parseInt(match[1]) : null
}

function extractCourseType(title: string): 'in-person' | 'online' | 'exam' | 'kit' {
  if (title.toLowerCase().includes('online')) return 'online'
  if (title.toLowerCase().includes('exam') || title.toLowerCase().includes('invigilation')) return 'exam'
  if (title.toLowerCase().includes('kit') || title.toLowerCase().includes('sample')) return 'kit'
  return 'in-person'
}

function extractSubject(title: string): 'wine' | 'beer' | 'spirit' | 'other' {
  const titleLower = title.toLowerCase()
  if (titleLower.includes('wine')) return 'wine'
  if (titleLower.includes('beer')) return 'beer'
  if (titleLower.includes('spirit')) return 'spirit'
  return 'other'
}

function generateOrderNumber(squarespaceOrderId: string): string {
  // Convert "00229" to "SBE-2024-229" format
  const orderNum = parseInt(squarespaceOrderId).toString()
  return `SBE-2024-${orderNum.padStart(3, '0')}`
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function extractCustomerName(billingName: string): { firstName: string; lastName: string } {
  const parts = billingName.trim().split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  return { firstName, lastName }
}

// Main import functions
async function importHistoricalDiscountCodes(orders: SquarespaceOrder[]) {
  console.log('📋 Importing historical discount codes...')

  const discountCodesUsed = new Set<string>()
  orders.forEach(order => {
    if (order['Discount Code']) {
      discountCodesUsed.add(order['Discount Code'])
    }
  })

  const discountCodes = Array.from(discountCodesUsed).map(code => ({
    code,
    name: `Historical: ${code}`,
    description: `Imported from Squarespace historical data`,
    type: 'fixed_amount' as const,
    value: 50.00, // Default value, will be overridden by actual usage
    active: false, // Disable historical codes
    created_at: new Date().toISOString()
  }))

  if (discountCodes.length > 0) {
    const { data, error } = await supabase
      .from('discount_codes')
      .upsert(discountCodes, { onConflict: 'code' })

    if (error) {
      console.error('❌ Error importing discount codes:', error)
    } else {
      console.log(`✅ Imported ${discountCodes.length} discount codes`)
    }
  }
}

async function importHistoricalProducts(products: SquarespaceProduct[]) {
  console.log('📦 Importing historical products...')

  const productData = products
    .filter(product => product.Visible === 'Yes' && parsePrice(product.Price) > 0)
    .map(product => ({
      name: product.Title,
      description: product.Description.replace(/<[^>]*>/g, ''), // Strip HTML
      type: 'course_session',
      active: true,
      metadata: {
        squarespace_id: product['Product ID [Non Editable]'],
        original_sku: product.SKU,
        wset_level: extractWSETLevel(product.Title),
        course_type: extractCourseType(product.Title),
        subject: extractSubject(product.Title),
        categories: product.Categories,
        tags: product.Tags
      }
    }))

  if (productData.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)

    if (error) {
      console.error('❌ Error importing products:', error)
    } else {
      console.log(`✅ Imported ${productData.length} products`)
      return data
    }
  }

  return []
}

async function importHistoricalCustomers(orders: SquarespaceOrder[]) {
  console.log('👥 Importing historical customers...')

  // Deduplicate customers by email
  const customerMap = new Map<string, SquarespaceOrder>()
  orders.forEach(order => {
    const email = normalizeEmail(order.Email)
    if (email && !customerMap.has(email)) {
      customerMap.set(email, order)
    }
  })

  const customers = Array.from(customerMap.values())
    .filter(order => order['Billing Name'])
    .map(order => {
      const { firstName, lastName } = extractCustomerName(order['Billing Name'])
      return {
        first_name: firstName,
        last_name: lastName,
        email: normalizeEmail(order.Email),
        phone: order['Billing Phone'] || null,
        notes: 'Imported from Squarespace historical data',
        customer_since: parseDate(order['Created at'])?.toISOString().split('T')[0] || null,
        marketing_consent: true, // Assume consent for historical customers
        communication_preferences: {
          email: true,
          sms: false,
          marketing: true
        }
      }
    })

  if (customers.length > 0) {
    const { data, error } = await supabase
      .from('candidates')
      .upsert(customers, { onConflict: 'email' })

    if (error) {
      console.error('❌ Error importing customers:', error)
    } else {
      console.log(`✅ Imported ${customers.length} customers`)
      return data
    }
  }

  return []
}

async function importHistoricalOrders(orders: SquarespaceOrder[]) {
  console.log('📋 Importing historical orders...')

  // Group orders by Order ID since line items are separate rows
  const orderGroups = new Map<string, SquarespaceOrder[]>()
  orders.forEach(order => {
    if (!orderGroups.has(order['Order ID'])) {
      orderGroups.set(order['Order ID'], [])
    }
    orderGroups.get(order['Order ID'])!.push(order)
  })

  // Get existing candidates for email mapping
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, email')

  const candidateMap = new Map(
    candidates?.map(c => [c.email.toLowerCase(), c.id]) || []
  )

  const ordersToImport = []
  const orderItemsToImport = []

  for (const [orderId, orderItems] of orderGroups) {
    const primaryOrder = orderItems[0]
    if (!primaryOrder.Email) continue

    const customerEmail = normalizeEmail(primaryOrder.Email)
    const candidateId = candidateMap.get(customerEmail)

    if (!candidateId) {
      console.log(`⚠️  Skipping order ${orderId} - customer not found: ${customerEmail}`)
      continue
    }

    const { firstName, lastName } = extractCustomerName(primaryOrder['Billing Name'])
    const orderNumber = generateOrderNumber(orderId)

    const orderData = {
      order_number: orderNumber,
      customer_email: customerEmail,
      customer_name: primaryOrder['Billing Name'],
      customer_phone: primaryOrder['Billing Phone'] || null,
      billing_address: {
        address1: primaryOrder['Billing Address1'],
        city: primaryOrder['Billing City'],
        zip: primaryOrder['Billing Zip'],
        province: primaryOrder['Billing Province'],
        country: primaryOrder['Billing Country']
      },
      subtotal_amount: parsePrice(primaryOrder.Subtotal),
      tax_amount: parsePrice(primaryOrder.Taxes),
      discount_amount: parsePrice(primaryOrder['Discount Amount']),
      total_amount: parsePrice(primaryOrder.Total),
      currency: primaryOrder.Currency || 'USD',
      stripe_payment_intent_id: null, // Clear to avoid duplicates in historical data
      status: primaryOrder['Financial Status'] === 'PAID' ? 'paid' : 'pending',
      payment_status: primaryOrder['Financial Status'] === 'PAID' ? 'succeeded' : 'pending',
      fulfillment_status: 'fulfilled', // Assume historical orders are fulfilled
      discount_code: primaryOrder['Discount Code'] || null,
      candidate_id: candidateId,
      created_at: parseDate(primaryOrder['Created at'])?.toISOString() || new Date().toISOString(),
      paid_at: parseDate(primaryOrder['Paid at'])?.toISOString() || null,
      notes: 'Imported from Squarespace historical data'
    }

    ordersToImport.push(orderData)

    // Create order items for each line item
    orderItems.forEach((item, index) => {
      if (item['Lineitem name']) {
        orderItemsToImport.push({
          order_id: orderNumber, // Will be replaced with actual order ID after insert
          name: item['Lineitem name'],
          description: null,
          sku: item['Lineitem sku'] || null,
          quantity: parseInt(item['Lineitem quantity']) || 1,
          unit_price: parsePrice(item['Lineitem price']),
          total_price: parsePrice(item['Lineitem price']) * (parseInt(item['Lineitem quantity']) || 1),
          product_snapshot: {
            squarespace_order_id: orderId,
            line_item_index: index,
            original_data: item
          }
        })
      }
    })
  }

  // Insert orders
  if (ordersToImport.length > 0) {
    const { data: insertedOrders, error: orderError } = await supabase
      .from('orders')
      .upsert(ordersToImport, { onConflict: 'order_number' })
      .select('id, order_number')

    if (orderError) {
      console.error('❌ Error importing orders:', orderError)
      return
    }

    console.log(`✅ Imported ${insertedOrders?.length || 0} orders`)

    // Create order ID mapping for order items
    const orderIdMap = new Map(
      insertedOrders?.map(o => [o.order_number, o.id]) || []
    )

    // Update order items with correct order IDs
    const orderItemsWithIds = orderItemsToImport.map(item => ({
      ...item,
      order_id: orderIdMap.get(item.order_id as string) || null
    })).filter(item => item.order_id)

    // Insert order items
    if (orderItemsWithIds.length > 0) {
      const { data: insertedItems, error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemsWithIds)

      if (itemError) {
        console.error('❌ Error importing order items:', itemError)
      } else {
        console.log(`✅ Imported ${orderItemsWithIds.length} order items`)
      }
    }
  }
}

async function updateCustomerStatistics() {
  console.log('📊 Updating customer statistics...')
  // Statistics will be updated by database triggers when orders are processed
  console.log('✅ Customer statistics will be updated by database triggers')
}

// Main import process
async function main() {
  console.log('🚀 Starting historical data import...')

  try {
    // Read CSV files
    const ordersPath = path.join(process.cwd(), 'public/historical/orders.csv')
    const productsPath = path.join(process.cwd(), 'public/historical/products_Sep-17_09-44-32AM.csv')

    if (!fs.existsSync(ordersPath) || !fs.existsSync(productsPath)) {
      throw new Error('Historical data files not found. Please ensure files are in public/historical/')
    }

    const ordersCSV = fs.readFileSync(ordersPath, 'utf-8')
    const productsCSV = fs.readFileSync(productsPath, 'utf-8')

    const orders: SquarespaceOrder[] = parse(ordersCSV, {
      columns: true,
      skip_empty_lines: true
    })

    const products: SquarespaceProduct[] = parse(productsCSV, {
      columns: true,
      skip_empty_lines: true
    })

    console.log(`📊 Found ${orders.length} order records and ${products.length} products`)

    // Import in sequence to maintain referential integrity
    await importHistoricalDiscountCodes(orders)
    await importHistoricalProducts(products)
    await importHistoricalCustomers(orders)
    await importHistoricalOrders(orders)
    await updateCustomerStatistics()

    console.log('🎉 Historical data import completed successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

// Customer stats will be handled by database triggers

// Run import if script is executed directly
if (require.main === module) {
  main()
}