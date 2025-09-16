'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  wset_level: z.coerce.number().min(1).max(4, 'WSET level must be 1-4'),
  description: z.string().optional(),
  duration_weeks: z.coerce.number().min(1, 'Duration must be at least 1 week'),
  price: z.coerce.number().min(0, 'Price must be positive').optional(),
  max_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
})

const sessionSchema = z.object({
  course_id: z.string().uuid(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  instructor: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
})

// Course CRUD operations
export async function getCourses() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('wset_level', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`)
  }

  return data
}

export async function getCourse(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch course: ${error.message}`)
  }

  return data
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    name: formData.get('name'),
    wset_level: formData.get('wset_level'),
    description: formData.get('description') || null,
    duration_weeks: formData.get('duration_weeks'),
    price: formData.get('price') || null,
    max_capacity: formData.get('max_capacity'),
  }

  const validatedData = courseSchema.parse(rawData)

  const { error } = await supabase
    .from('courses')
    .insert(validatedData)

  if (error) {
    throw new Error(`Failed to create course: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  redirect('/dashboard/courses')
}

export async function updateCourse(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    name: formData.get('name'),
    wset_level: formData.get('wset_level'),
    description: formData.get('description') || null,
    duration_weeks: formData.get('duration_weeks'),
    price: formData.get('price') || null,
    max_capacity: formData.get('max_capacity'),
  }

  const validatedData = courseSchema.parse(rawData)

  const { error } = await supabase
    .from('courses')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update course: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  redirect('/dashboard/courses')
}

export async function deleteCourse(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
}

// Course Session CRUD operations
export async function getCourseSessions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_sessions')
    .select(`
      *,
      courses (name, wset_level, max_capacity)
    `)
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch course sessions: ${error.message}`)
  }

  return data
}

export async function getCourseSession(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_sessions')
    .select(`
      *,
      courses (name, wset_level, max_capacity)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch course session: ${error.message}`)
  }

  return data
}

export async function createCourseSession(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    course_id: formData.get('course_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    instructor: formData.get('instructor') || null,
    location: formData.get('location') || null,
    status: formData.get('status') || 'scheduled',
  }

  const validatedData = sessionSchema.parse(rawData)

  // Validate that end_date is after start_date
  if (new Date(validatedData.end_date) <= new Date(validatedData.start_date)) {
    throw new Error('End date must be after start date')
  }

  const { error } = await supabase
    .from('course_sessions')
    .insert(validatedData)

  if (error) {
    throw new Error(`Failed to create course session: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  redirect('/dashboard/courses')
}

export async function updateCourseSession(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    course_id: formData.get('course_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    instructor: formData.get('instructor') || null,
    location: formData.get('location') || null,
    status: formData.get('status') || 'scheduled',
  }

  const validatedData = sessionSchema.parse(rawData)

  // Validate that end_date is after start_date
  if (new Date(validatedData.end_date) <= new Date(validatedData.start_date)) {
    throw new Error('End date must be after start date')
  }

  const { error } = await supabase
    .from('course_sessions')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update course session: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
  redirect('/dashboard/courses')
}

export async function deleteCourseSession(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('course_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete course session: ${error.message}`)
  }

  revalidatePath('/dashboard/courses')
}

export async function getUpcomingSessions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('course_sessions')
    .select(`
      *,
      courses (name, wset_level)
    `)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(10)

  if (error) {
    throw new Error(`Failed to fetch upcoming sessions: ${error.message}`)
  }

  return data
}