'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const courseTemplateSchema = z.object({
  wset_level: z.coerce.number().min(1).max(4, 'WSET level must be 1-4'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  duration_weeks: z.coerce.number().min(1, 'Duration must be at least 1 week'),
  max_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  price: z.coerce.number().min(0, 'Price must be positive').optional(),
})

export async function getCourseTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_templates')
    .select('*')
    .order('wset_level', { ascending: true })

  if (error) {
    // Fallback to hardcoded templates if database table doesn't exist yet
    const fallbackTemplates = [
      {
        id: 'fallback-1',
        wset_level: 1,
        name: 'WSET Level 1 Award in Wines',
        description: 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.',
        duration_weeks: 1,
        max_capacity: 16,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-2',
        wset_level: 2,
        name: 'WSET Level 2 Award in Wines',
        description: 'For those with some knowledge who want to understand wine in greater depth.',
        duration_weeks: 2,
        max_capacity: 20,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-3',
        wset_level: 3,
        name: 'WSET Level 3 Award in Wines',
        description: 'A comprehensive study of wines suitable for wine professionals and serious enthusiasts.',
        duration_weeks: 6,
        max_capacity: 18,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-4',
        wset_level: 4,
        name: 'WSET Level 4 Diploma in Wines',
        description: 'The most advanced qualification for wine professionals, covering viticulture, winemaking, and business.',
        duration_weeks: 52,
        max_capacity: 12,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    return fallbackTemplates
  }

  return data
}

export async function getCourseTemplate(wsetLevel: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_templates')
    .select('*')
    .eq('wset_level', wsetLevel)
    .single()

  if (error) {
    // Fallback to hardcoded templates if database table doesn't exist yet
    const fallbackTemplates = {
      1: {
        id: 'fallback-1',
        wset_level: 1,
        name: 'WSET Level 1 Award in Wines',
        description: 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.',
        duration_weeks: 1,
        max_capacity: 16,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      2: {
        id: 'fallback-2',
        wset_level: 2,
        name: 'WSET Level 2 Award in Wines',
        description: 'For those with some knowledge who want to understand wine in greater depth.',
        duration_weeks: 2,
        max_capacity: 20,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      3: {
        id: 'fallback-3',
        wset_level: 3,
        name: 'WSET Level 3 Award in Wines',
        description: 'A comprehensive study of wines suitable for wine professionals and serious enthusiasts.',
        duration_weeks: 6,
        max_capacity: 18,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      4: {
        id: 'fallback-4',
        wset_level: 4,
        name: 'WSET Level 4 Diploma in Wines',
        description: 'The most advanced qualification for wine professionals, covering viticulture, winemaking, and business.',
        duration_weeks: 52,
        max_capacity: 12,
        price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    const template = fallbackTemplates[wsetLevel as keyof typeof fallbackTemplates]
    if (!template) {
      throw new Error(`No template found for WSET level ${wsetLevel}`)
    }

    return template
  }

  return data
}

export async function updateCourseTemplate(wsetLevel: number, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    wset_level: wsetLevel,
    name: formData.get('name'),
    description: formData.get('description') || null,
    duration_weeks: formData.get('duration_weeks'),
    max_capacity: formData.get('max_capacity'),
    price: formData.get('price') || null,
  }

  const validatedData = courseTemplateSchema.parse(rawData)

  const { error } = await supabase
    .from('course_templates')
    .update(validatedData)
    .eq('wset_level', wsetLevel)

  if (error) {
    throw new Error(`Failed to update course template: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  revalidatePath('/dashboard/course-templates')
}

export async function createCourseTemplate(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    wset_level: formData.get('wset_level'),
    name: formData.get('name'),
    description: formData.get('description') || null,
    duration_weeks: formData.get('duration_weeks'),
    max_capacity: formData.get('max_capacity'),
    price: formData.get('price') || null,
  }

  const validatedData = courseTemplateSchema.parse(rawData)

  const { error } = await supabase
    .from('course_templates')
    .insert(validatedData)

  if (error) {
    throw new Error(`Failed to create course template: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  revalidatePath('/dashboard/course-templates')
}