'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Course Templates
export async function getCourseTemplates() {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from('course_templates')
    .select('*')
    .order('wset_level', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch course templates: ${error.message}`)
  }

  return templates || []
}

export async function getCourseTemplate(id: string) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('course_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch course template: ${error.message}`)
  }

  return template
}

export async function updateCourseTemplate(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('course_templates')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update course template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return { success: true }
}

export async function createCourseTemplate(data: any) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('course_templates')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create course template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return template
}

// Exam Templates
export async function getExamTemplates() {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from('exam_templates')
    .select('*')
    .order('wset_level', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exam templates: ${error.message}`)
  }

  return templates || []
}

export async function getExamTemplate(id: string) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('exam_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exam template: ${error.message}`)
  }

  return template
}

export async function updateExamTemplate(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('exam_templates')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update exam template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return { success: true }
}

export async function createExamTemplate(data: any) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('exam_templates')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create exam template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return template
}

// Digital Product Templates
export async function getDigitalProductTemplates() {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from('digital_product_templates')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch digital product templates: ${error.message}`)
  }

  return templates || []
}

export async function getDigitalProductTemplate(id: string) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('digital_product_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch digital product template: ${error.message}`)
  }

  return template
}

export async function updateDigitalProductTemplate(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('digital_product_templates')
    .update(data)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update digital product template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return { success: true }
}

export async function createDigitalProductTemplate(data: any) {
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('digital_product_templates')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create digital product template: ${error.message}`)
  }

  revalidatePath('/dashboard/course-templates')
  return template
}

// Course Session Creation with Auto Product Generation
export async function createCourseSession(data: any) {
  const supabase = await createClient()

  // The trigger will automatically create the product when we insert the session
  const { data: session, error } = await supabase
    .from('course_sessions')
    .insert(data)
    .select(`
      *,
      products (
        id,
        name,
        stripe_product_id,
        active
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create course session: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  revalidatePath('/dashboard/products')
  return session
}

// Get template stats for dashboard
export async function getTemplateStats() {
  const supabase = await createClient()

  // Get template counts
  const [courseTemplatesResult, examTemplatesResult, digitalProductTemplatesResult] = await Promise.all([
    supabase.from('course_templates').select('id, is_active').eq('is_active', true),
    supabase.from('exam_templates').select('id, is_active').eq('is_active', true),
    supabase.from('digital_product_templates').select('id, is_active').eq('is_active', true)
  ])

  // Get recent sessions created from templates
  const { data: recentSessions } = await supabase
    .from('course_sessions')
    .select(`
      id,
      start_date,
      products!inner(
        name,
        metadata
      )
    `)
    .not('product_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    activeCourseTemplates: courseTemplatesResult.data?.length || 0,
    activeExamTemplates: examTemplatesResult.data?.length || 0,
    activeDigitalProductTemplates: digitalProductTemplatesResult.data?.length || 0,
    recentAutoGeneratedSessions: recentSessions?.length || 0,
    recentSessions: recentSessions || []
  }
}