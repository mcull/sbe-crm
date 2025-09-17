'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OfferingType = 'tasting' | 'wset_course' | 'standalone_exam' | 'product'
export type DeliveryMethod = 'in_person' | 'online' | 'hybrid'
export type ComponentType = 'addon' | 'upgrade' | 'required'

// Offerings Management
export async function getOfferings(type?: OfferingType) {
  const supabase = await createClient()

  let query = supabase
    .from('offerings')
    .select('*')
    .order('type', { ascending: true })
    .order('wset_level', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data: offerings, error } = await query

  if (error) {
    throw new Error(`Failed to fetch offerings: ${error.message}`)
  }

  return offerings || []
}

export async function getOffering(id: string) {
  const supabase = await createClient()

  const { data: offering, error } = await supabase
    .from('offerings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch offering: ${error.message}`)
  }

  return offering
}

export async function createOffering(data: {
  name: string
  description?: string
  type: OfferingType
  wset_level?: number
  exam_type?: string
  base_price: number
  default_duration_hours?: number
  default_capacity?: number
  metadata?: any
}) {
  const supabase = await createClient()

  const { data: offering, error } = await supabase
    .from('offerings')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create offering: ${error.message}`)
  }

  revalidatePath('/dashboard/offerings')
  return offering
}

export async function updateOffering(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('offerings')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update offering: ${error.message}`)
  }

  revalidatePath('/dashboard/offerings')
  return { success: true }
}

// Sessions Management
export async function getSessions(offeringId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('sessions')
    .select(`
      *,
      offerings (
        id,
        name,
        type,
        wset_level,
        base_price
      ),
      products (
        id,
        name,
        stripe_product_id
      )
    `)
    .order('session_date', { ascending: true })

  if (offeringId) {
    query = query.eq('offering_id', offeringId)
  }

  const { data: sessions, error } = await query

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`)
  }

  return sessions || []
}

export async function getSession(id: string) {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      offerings (
        id,
        name,
        type,
        wset_level,
        base_price,
        metadata
      ),
      linked_course:offerings!linked_course_offering_id (
        id,
        name,
        type,
        wset_level
      ),
      products (
        id,
        name,
        stripe_product_id,
        active
      ),
      session_components (
        id,
        component_id,
        override_price,
        is_included,
        is_required,
        components (
          id,
          name,
          description,
          type,
          price
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch session: ${error.message}`)
  }

  return session
}

export async function createSession(data: {
  offering_id: string
  linked_course_offering_id?: string
  name?: string
  session_date: string
  end_date?: string
  location?: string
  instructor?: string
  delivery_method?: DeliveryMethod
  max_capacity: number
  early_bird_deadline?: string
  registration_deadline?: string
  early_bird_discount_percent?: number
}) {
  const supabase = await createClient()

  // The trigger will automatically create the product
  const { data: session, error } = await supabase
    .from('sessions')
    .insert(data)
    .select(`
      *,
      products (
        id,
        name,
        stripe_product_id
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  revalidatePath('/dashboard/offerings')
  revalidatePath('/dashboard/sessions')
  revalidatePath('/dashboard/products')
  return session
}

export async function updateSession(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`)
  }

  revalidatePath('/dashboard/offerings')
  revalidatePath('/dashboard/sessions')
  return { success: true }
}

// Components Management
export async function getComponents(type?: ComponentType) {
  const supabase = await createClient()

  let query = supabase
    .from('components')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data: components, error } = await query

  if (error) {
    throw new Error(`Failed to fetch components: ${error.message}`)
  }

  return components || []
}

export async function getApplicableComponents(offeringType: OfferingType, wsetLevel?: number, deliveryMethod?: DeliveryMethod) {
  const supabase = await createClient()

  let query = supabase
    .from('components')
    .select('*')
    .eq('active', true)
    .contains('applicable_offering_types', [offeringType])

  const { data: components, error } = await query

  if (error) {
    throw new Error(`Failed to fetch applicable components: ${error.message}`)
  }

  // Filter by WSET level and delivery method in JavaScript since array queries are complex
  return (components || []).filter(component => {
    if (wsetLevel && component.applicable_wset_levels && component.applicable_wset_levels.length > 0) {
      if (!component.applicable_wset_levels.includes(wsetLevel)) {
        return false
      }
    }

    if (deliveryMethod && component.applicable_delivery_methods && component.applicable_delivery_methods.length > 0) {
      if (!component.applicable_delivery_methods.includes(deliveryMethod)) {
        return false
      }
    }

    return true
  })
}

export async function createComponent(data: {
  name: string
  description?: string
  type: ComponentType
  price: number
  applicable_offering_types?: OfferingType[]
  applicable_wset_levels?: number[]
  applicable_delivery_methods?: DeliveryMethod[]
  is_physical?: boolean
  inventory_tracked?: boolean
  inventory_quantity?: number
  metadata?: any
}) {
  const supabase = await createClient()

  const { data: component, error } = await supabase
    .from('components')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create component: ${error.message}`)
  }

  revalidatePath('/dashboard/components')
  return component
}

export async function linkComponentToSession(sessionId: string, componentId: string, options: {
  override_price?: number
  is_included?: boolean
  is_required?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('session_components')
    .insert({
      session_id: sessionId,
      component_id: componentId,
      ...options
    })

  if (error) {
    throw new Error(`Failed to link component to session: ${error.message}`)
  }

  revalidatePath('/dashboard/sessions')
  return { success: true }
}

// Dashboard stats
export async function getOfferingsStats() {
  const supabase = await createClient()

  // Get counts by type
  const [offeringsResult, sessionsResult, upcomingSessionsResult] = await Promise.all([
    supabase.from('offerings').select('type, active').eq('active', true),
    supabase.from('sessions').select('id, current_enrollment, max_capacity, session_date').gte('session_date', new Date().toISOString()),
    supabase.from('sessions').select(`
      id,
      session_date,
      current_enrollment,
      max_capacity,
      offerings (
        name,
        type
      )
    `).gte('session_date', new Date().toISOString()).order('session_date', { ascending: true }).limit(5)
  ])

  const offerings = offeringsResult.data || []
  const sessions = sessionsResult.data || []
  const upcomingSessions = upcomingSessionsResult.data || []

  const stats = {
    totalOfferings: offerings.length,
    offeringsByType: {
      wset_course: offerings.filter(o => o.type === 'wset_course').length,
      standalone_exam: offerings.filter(o => o.type === 'standalone_exam').length,
      tasting: offerings.filter(o => o.type === 'tasting').length,
      product: offerings.filter(o => o.type === 'product').length
    },
    upcomingSessions: sessions.length,
    totalCapacity: sessions.reduce((sum, s) => sum + (s.max_capacity || 0), 0),
    totalEnrollment: sessions.reduce((sum, s) => sum + (s.current_enrollment || 0), 0),
    availableSpots: sessions.reduce((sum, s) => sum + Math.max(0, (s.max_capacity || 0) - (s.current_enrollment || 0)), 0),
    nextSessions: upcomingSessions
  }

  return stats
}