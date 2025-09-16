'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const candidateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function getCandidates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch candidates: ${error.message}`)
  }

  return data
}

export async function getCandidate(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch candidate: ${error.message}`)
  }

  return data
}

export async function createCandidate(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || null,
    notes: formData.get('notes') || null,
  }

  const validatedData = candidateSchema.parse(rawData)

  const { error } = await supabase
    .from('candidates')
    .insert(validatedData)

  if (error) {
    throw new Error(`Failed to create candidate: ${error.message}`)
  }

  revalidatePath('/dashboard/candidates')
  redirect('/dashboard/candidates')
}

export async function updateCandidate(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || null,
    notes: formData.get('notes') || null,
  }

  const validatedData = candidateSchema.parse(rawData)

  const { error } = await supabase
    .from('candidates')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update candidate: ${error.message}`)
  }

  revalidatePath('/dashboard/candidates')
  redirect('/dashboard/candidates')
}

export async function deleteCandidate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete candidate: ${error.message}`)
  }

  revalidatePath('/dashboard/candidates')
}

export async function searchCandidates(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to search candidates: ${error.message}`)
  }

  return data
}