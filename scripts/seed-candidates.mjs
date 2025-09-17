#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqbmzlknzxwajgqzmbxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYm16bGtuenh3YWpncXptYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0MTA1MywiZXhwIjoyMDczNjE3MDUzfQ.VP0ObiAuuvMZ2ZzdReTg3tibECnJJ2tSEQuY_BJ55EM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const sampleCandidates = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    notes: 'Interested in Level 1 Wine certification. Works in restaurant industry.'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '(555) 234-5678',
    notes: 'Sommelier looking to advance to Level 2. Has previous wine experience.'
  },
  {
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@example.com',
    phone: '(555) 345-6789',
    notes: 'Wine enthusiast. New to formal wine education.'
  },
  {
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '(555) 456-7890',
    notes: 'Hospitality manager. Company sponsor for Level 1 course.'
  },
  {
    first_name: 'David',
    last_name: 'Thompson',
    email: 'david.thompson@example.com',
    phone: null,
    notes: null
  },
  {
    first_name: 'Lisa',
    last_name: 'Wang',
    email: 'lisa.wang@example.com',
    phone: '(555) 567-8901',
    notes: 'Completed Level 1 last year. Ready for Level 2 certification.'
  }
]

async function seedCandidates() {
  console.log('🌱 Seeding sample candidates...')

  try {
    // Check if candidates already exist
    const { data: existing, error: checkError } = await supabase
      .from('candidates')
      .select('*')

    if (checkError) {
      console.error('❌ Error checking existing candidates:', checkError.message)
      return
    }

    if (existing.length > 0) {
      console.log(`📋 Found ${existing.length} existing candidates. Clearing them first...`)
      const { error: clearError } = await supabase
        .from('candidates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (clearError) {
        console.log('⚠️  Could not clear existing candidates:', clearError.message)
      }
    }

    // Insert sample candidates
    const { data: inserted, error: insertError } = await supabase
      .from('candidates')
      .insert(sampleCandidates)
      .select()

    if (insertError) {
      console.error('❌ Error inserting candidates:', insertError.message)
      return
    }

    console.log(`✅ Successfully created ${inserted.length} sample candidates:`)
    inserted.forEach(candidate => {
      console.log(`  - ${candidate.first_name} ${candidate.last_name} (${candidate.email})`)
    })

    console.log('\n🎉 Sample data seeded successfully!')
    console.log('You can now test the candidate management UI at http://localhost:3004/dashboard/candidates')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

seedCandidates()