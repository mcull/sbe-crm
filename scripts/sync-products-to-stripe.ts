#!/usr/bin/env tsx

/**
 * Sync Products to Stripe Script
 *
 * Syncs all products from the database to Stripe, creating products and prices
 */

import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/server'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set environment variables.')
  process.exit(1)
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY. Please set environment variable.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🚀 Starting product sync to Stripe...')

  try {
    // Get all active products from database
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    if (!products || products.length === 0) {
      console.log('No active products to sync')
      return
    }

    console.log(`Found ${products.length} products to sync`)

    let syncedProducts = 0
    let createdPrices = 0

    for (const product of products) {
      try {
        console.log(`\n📦 Processing: ${product.name}`)

        // Sync product to Stripe
        const stripeProductData = {
          name: product.name,
          description: product.description || undefined,
          metadata: {
            product_id: product.id,
            type: product.type,
            ...(product.metadata as object || {})
          },
          active: product.active
        }

        let stripeProduct

        if (product.stripe_product_id) {
          // Update existing Stripe product
          stripeProduct = await stripe.products.update(product.stripe_product_id, stripeProductData)
        } else {
          // Create new Stripe product
          stripeProduct = await stripe.products.create(stripeProductData)

          // Update our database with the Stripe product ID
          await supabase
            .from('products')
            .update({ stripe_product_id: stripeProduct.id })
            .eq('id', product.id)
        }

        console.log(`✅ Product synced: ${stripeProduct.id}`)
        syncedProducts++

        // Create price if we don't have one and we have pricing info
        if (!product.stripe_price_id) {
          // Try to determine price from various sources
          let priceAmount = 0

          // Check if this is a course session product
          if (product.type === 'course_session') {
            // Look for related course sessions to get pricing
            const { data: sessions } = await supabase
              .from('course_sessions')
              .select('base_price')
              .eq('product_id', product.id)
              .order('base_price', { ascending: false })
              .limit(1)

            if (sessions && sessions.length > 0 && sessions[0].base_price) {
              priceAmount = Math.round(sessions[0].base_price * 100) // Convert to cents
            }
          }

          // Check historical order items for pricing
          if (priceAmount === 0) {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('unit_price')
              .eq('product_id', product.id)
              .not('unit_price', 'is', null)
              .order('unit_price', { ascending: false })
              .limit(1)

            if (orderItems && orderItems.length > 0 && orderItems[0].unit_price) {
              priceAmount = Math.round(orderItems[0].unit_price * 100) // Convert to cents
            }
          }

          // Default pricing based on product type and metadata
          if (priceAmount === 0) {
            const metadata = product.metadata as any || {}

            if (metadata.wset_level) {
              // WSET course pricing defaults
              switch (metadata.wset_level) {
                case 1:
                  priceAmount = 32500 // $325
                  break
                case 2:
                  priceAmount = 57500 // $575
                  break
                case 3:
                  priceAmount = 135000 // $1,350
                  break
                case 4:
                  priceAmount = 200000 // $2,000
                  break
                default:
                  priceAmount = 50000 // $500 default
              }

              if (metadata.course_type === 'online') {
                priceAmount = Math.round(priceAmount * 0.6) // 40% discount for online
              }
            } else if (product.type === 'digital_product') {
              priceAmount = 5000 // $50 default for digital
            } else {
              priceAmount = 10000 // $100 default
            }
          }

          if (priceAmount > 0) {
            try {
              const price = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: priceAmount,
                currency: 'usd',
                nickname: `Default price for ${product.name}`,
                metadata: {
                  product_id: product.id
                }
              })

              // Update our database with the default price ID
              await supabase
                .from('products')
                .update({ stripe_price_id: price.id })
                .eq('id', product.id)

              console.log(`✅ Price created: $${(priceAmount / 100).toFixed(2)}`)
              createdPrices++
            } catch (priceError) {
              console.error(`❌ Failed to create price: ${priceError}`)
            }
          } else {
            console.log(`⚠️  Skipped price creation (no pricing data found)`)
          }
        } else {
          console.log(`✅ Price already exists`)
        }

      } catch (error) {
        console.error(`❌ Failed to process product ${product.name}:`, error)
      }
    }

    console.log(`\n🎉 Sync completed!`)
    console.log(`✅ Products synced: ${syncedProducts}/${products.length}`)
    console.log(`✅ Prices created: ${createdPrices}`)

  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  }
}

// Run sync if script is executed directly
if (require.main === module) {
  main()
}