import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { findOrCreateStripeCustomer } from '@/lib/stripe/customers'

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      customer_email,
      success_url,
      cancel_url
    } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (!customer_email) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 })
    }

    // Find or create Stripe customer
    const customerId = await findOrCreateStripeCustomer(customer_email)

    // Prepare line items for Stripe checkout
    const lineItems = items.map((item: any) => ({
      price: item.stripe_price_id,
      quantity: item.quantity || 1,
    }))

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancelled`,
      automatic_tax: {
        enabled: true,
      },
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      billing_address_collection: 'required',
      invoice_creation: {
        enabled: true,
      },
      metadata: {
        customer_email,
        created_via: 'checkout_api'
      }
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}