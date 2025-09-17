import { stripe } from './server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

/**
 * Create or update a Stripe product from our database product
 */
export async function syncProductToStripe(product: Product): Promise<string> {
  try {
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
      const supabase = await createClient()
      await supabase
        .from('products')
        .update({ stripe_product_id: stripeProduct.id })
        .eq('id', product.id)
    }

    return stripeProduct.id
  } catch (error) {
    console.error('Error syncing product to Stripe:', error)
    throw error
  }
}

/**
 * Create a Stripe price for a product
 */
export async function createStripePrice(
  productId: string,
  stripeProductId: string,
  priceData: {
    amount: number // in cents
    currency?: string
    nickname?: string
  }
): Promise<string> {
  try {
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: priceData.amount,
      currency: priceData.currency || 'usd',
      nickname: priceData.nickname,
      metadata: {
        product_id: productId
      }
    })

    // Update our database with the default price ID
    const supabase = await createClient()
    await supabase
      .from('products')
      .update({ stripe_price_id: price.id })
      .eq('id', productId)

    return price.id
  } catch (error) {
    console.error('Error creating Stripe price:', error)
    throw error
  }
}

/**
 * Sync all products from database to Stripe
 */
export async function syncAllProductsToStripe(): Promise<void> {
  const supabase = await createClient()

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

  console.log(`Syncing ${products.length} products to Stripe...`)

  for (const product of products) {
    try {
      await syncProductToStripe(product)
      console.log(`✅ Synced product: ${product.name}`)
    } catch (error) {
      console.error(`❌ Failed to sync product ${product.name}:`, error)
    }
  }

  console.log('Product sync completed')
}

/**
 * Get Stripe product by database product ID
 */
export async function getStripeProduct(productId: string) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('stripe_product_id')
    .eq('id', productId)
    .single()

  if (!product?.stripe_product_id) {
    throw new Error('Product not synced to Stripe')
  }

  return await stripe.products.retrieve(product.stripe_product_id)
}