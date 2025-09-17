#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqbmzlknzxwajgqzmbxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYm16bGtuenh3YWpncXptYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0MTA1MywiZXhwIjoyMDczNjE3MDUzfQ.VP0ObiAuuvMZ2ZzdReTg3tibECnJJ2tSEQuY_BJ55EM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedExams() {
  console.log('🧪 Seeding sample exams...')

  try {
    // First, get available courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError.message)
      return
    }

    if (courses.length === 0) {
      console.log('⚠️  No courses found. Please seed courses first.')
      return
    }

    // Clear existing exams
    const { error: clearError } = await supabase
      .from('exams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (clearError) {
      console.log('⚠️  Could not clear existing exams:', clearError.message)
    }

    // Create sample exams with future dates
    const now = new Date()
    const sampleExams = [
      {
        course_id: courses[0].id, // Level 1
        exam_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        exam_type: 'theory',
        location: 'Southeastern Beverage Education - Main Hall',
        max_candidates: 20,
        current_registrations: 12,
        instructions: 'Please arrive 30 minutes early. Bring valid ID and calculator if needed.'
      },
      {
        course_id: courses[0].id, // Level 1
        exam_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
        exam_type: 'tasting',
        location: 'Southeastern Beverage Education - Tasting Room',
        max_candidates: 16,
        current_registrations: 8,
        instructions: 'No perfume or strong scents. Light meal recommended 2 hours before exam.'
      },
      {
        course_id: courses.find(c => c.wset_level === 2)?.id || courses[0].id, // Level 2 if available
        exam_date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 4 weeks from now
        exam_type: 'theory',
        location: 'Southeastern Beverage Education - Conference Room',
        max_candidates: 16,
        current_registrations: 14,
        instructions: 'Comprehensive written exam covering wine regions, grape varieties, and production methods.'
      },
      {
        course_id: courses.find(c => c.wset_level === 2)?.id || courses[0].id, // Level 2 if available
        exam_date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 5 weeks from now
        exam_type: 'tasting',
        location: 'Southeastern Beverage Education - Advanced Tasting Lab',
        max_candidates: 12,
        current_registrations: 5,
        instructions: 'Advanced tasting examination with 6 wines. Systematic approach to tasting required.'
      },
      {
        course_id: courses.find(c => c.wset_level === 3)?.id || courses[0].id, // Level 3 if available
        exam_date: new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000).toISOString(), // 8 weeks from now
        exam_type: 'practical',
        location: 'Southeastern Beverage Education - Service Training Center',
        max_candidates: 8,
        current_registrations: 3,
        instructions: 'Practical service examination including wine presentation, serving, and storage protocols.'
      },
      // Add a past exam for testing
      {
        course_id: courses[0].id, // Level 1
        exam_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        exam_type: 'theory',
        location: 'Southeastern Beverage Education - Main Hall',
        max_candidates: 20,
        current_registrations: 18,
        instructions: 'Completed Level 1 theory examination.'
      }
    ]

    const { data: inserted, error: insertError } = await supabase
      .from('exams')
      .insert(sampleExams)
      .select()

    if (insertError) {
      console.error('❌ Error inserting exams:', insertError.message)
      return
    }

    console.log(`✅ Successfully created ${inserted.length} sample exams:`)
    inserted.forEach(exam => {
      const examDate = new Date(exam.exam_date)
      const status = examDate > now ? '📅 Upcoming' : '✅ Completed'
      console.log(`  ${status} - ${exam.exam_type.toUpperCase()} exam on ${examDate.toLocaleDateString()} (${exam.current_registrations}/${exam.max_candidates})`)
    })

    console.log('\n🎉 Exam sample data seeded successfully!')
    console.log('You can now test the exam management UI at http://localhost:3004/dashboard/exams')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

seedExams()