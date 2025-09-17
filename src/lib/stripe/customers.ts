import { stripe } from './server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']

/**
 * Create or update a Stripe customer from our candidate data
 */
export async function syncCandidateToStripeCustomer(candidate: Candidate): Promise<string> {
  try {
    const customerData = {
      email: candidate.email,
      name: `${candidate.first_name} ${candidate.last_name}`.trim(),
      phone: candidate.phone || undefined,
      metadata: {
        candidate_id: candidate.id,
        customer_since: candidate.customer_since || '',
        total_orders: candidate.total_orders?.toString() || '0',
        total_spent: candidate.total_spent?.toString() || '0'
      }
    }

    let stripeCustomer

    if (candidate.stripe_customer_id) {
      // Update existing Stripe customer
      stripeCustomer = await stripe.customers.update(candidate.stripe_customer_id, customerData)
    } else {
      // Create new Stripe customer
      stripeCustomer = await stripe.customers.create(customerData)

      // Update our database with the Stripe customer ID
      const supabase = await createClient()
      await supabase
        .from('candidates')
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq('id', candidate.id)
    }

    return stripeCustomer.id
  } catch (error) {
    console.error('Error syncing candidate to Stripe customer:', error)
    throw error
  }
}

/**
 * Find or create Stripe customer by email
 */
export async function findOrCreateStripeCustomer(email: string): Promise<string> {
  const supabase = await createClient()

  // First check if we have this candidate in our database
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (candidate) {
    return await syncCandidateToStripeCustomer(candidate)
  }

  // If not in our database, check Stripe directly
  const customers = await stripe.customers.list({
    email,
    limit: 1
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create new customer in Stripe only (will be synced to database later)
  const customer = await stripe.customers.create({
    email,
    metadata: {
      created_via: 'checkout'
    }
  })

  return customer.id
}

/**
 * Get Stripe customer by candidate ID
 */
export async function getStripeCustomerByCandidateId(candidateId: string) {
  const supabase = await createClient()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('stripe_customer_id')
    .eq('id', candidateId)
    .single()

  if (!candidate?.stripe_customer_id) {
    throw new Error('Candidate not synced to Stripe')
  }

  return await stripe.customers.retrieve(candidate.stripe_customer_id)
}

/**
 * Sync candidate data back from Stripe customer
 */
export async function syncStripeCustomerToCandidate(stripeCustomerId: string): Promise<void> {
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId)

    if (customer.deleted) {
      return
    }

    const supabase = await createClient()

    // Find candidate by Stripe customer ID
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()

    if (existingCandidate) {
      // Update existing candidate
      await supabase
        .from('candidates')
        .update({
          email: customer.email || existingCandidate.email,
          first_name: customer.name?.split(' ')[0] || existingCandidate.first_name,
          last_name: customer.name?.split(' ').slice(1).join(' ') || existingCandidate.last_name,
          phone: customer.phone || existingCandidate.phone
        })
        .eq('id', existingCandidate.id)
    } else if (customer.email) {
      // Create new candidate from Stripe customer
      const names = customer.name?.split(' ') || ['', '']
      await supabase
        .from('candidates')
        .insert({
          email: customer.email,
          first_name: names[0] || '',
          last_name: names.slice(1).join(' ') || '',
          phone: customer.phone,
          stripe_customer_id: stripeCustomerId,
          notes: 'Created from Stripe customer data',
          marketing_consent: false
        })
    }
  } catch (error) {
    console.error('Error syncing Stripe customer to candidate:', error)
    throw error
  }
}