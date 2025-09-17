'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const examSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  exam_date: z.string().min(1, 'Exam date is required'),
  exam_type: z.enum(['theory', 'tasting', 'practical'], {
    required_error: 'Exam type is required'
  }),
  location: z.string().min(1, 'Location is required'),
  max_candidates: z.coerce.number().min(1, 'Maximum candidates must be at least 1'),
  instructions: z.string().optional(),
})

export async function getExams() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      courses (
        id,
        name,
        wset_level
      )
    `)
    .order('exam_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exams: ${error.message}`)
  }

  return data
}

export async function getExam(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      courses (
        id,
        name,
        wset_level
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch exam: ${error.message}`)
  }

  return data
}

export async function createExam(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    course_id: formData.get('course_id'),
    exam_date: formData.get('exam_date'),
    exam_type: formData.get('exam_type'),
    location: formData.get('location'),
    max_candidates: formData.get('max_candidates'),
    instructions: formData.get('instructions') || null,
  }

  const validatedData = examSchema.parse(rawData)

  const { error } = await supabase
    .from('exams')
    .insert(validatedData)

  if (error) {
    throw new Error(`Failed to create exam: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  redirect('/dashboard/exams')
}

export async function updateExam(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    course_id: formData.get('course_id'),
    exam_date: formData.get('exam_date'),
    exam_type: formData.get('exam_type'),
    location: formData.get('location'),
    max_candidates: formData.get('max_candidates'),
    instructions: formData.get('instructions') || null,
  }

  const validatedData = examSchema.parse(rawData)

  const { error } = await supabase
    .from('exams')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update exam: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
  redirect('/dashboard/exams')
}

export async function deleteExam(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete exam: ${error.message}`)
  }

  revalidatePath('/dashboard/exams')
}

export async function getExamRegistrations(examId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exam_results')
    .select(`
      *,
      candidates (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('exam_id', examId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch exam registrations: ${error.message}`)
  }

  return data
}

export async function registerCandidateForExam(examId: string, candidateId: string) {
  const supabase = await createClient()

  // First check if exam has capacity
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('max_candidates, current_registrations')
    .eq('id', examId)
    .single()

  if (examError) {
    throw new Error(`Failed to check exam capacity: ${examError.message}`)
  }

  const currentRegistrations = exam.current_registrations || 0
  if (currentRegistrations >= exam.max_candidates) {
    throw new Error('Exam is at full capacity')
  }

  // Register candidate
  const { error: registerError } = await supabase
    .from('exam_results')
    .insert({
      exam_id: examId,
      candidate_id: candidateId,
    })

  if (registerError) {
    throw new Error(`Failed to register candidate: ${registerError.message}`)
  }

  // Update registration count
  const { error: updateError } = await supabase
    .from('exams')
    .update({
      current_registrations: currentRegistrations + 1
    })
    .eq('id', examId)

  if (updateError) {
    throw new Error(`Failed to update registration count: ${updateError.message}`)
  }

  revalidatePath('/dashboard/exams')
}