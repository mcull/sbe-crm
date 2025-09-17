#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqbmzlknzxwajgqzmbxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYm16bGtuenh3YWpncXptYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0MTA1MywiZXhwIjoyMDczNjE3MDUzfQ.VP0ObiAuuvMZ2ZzdReTg3tibECnJJ2tSEQuY_BJ55EM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testCandidateOperations() {
  console.log('🧪 Testing candidate management operations...')

  try {
    // Test 1: Get all candidates
    console.log('\n📋 Test 1: Fetching candidates...')
    const { data: candidates, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError.message)
      return
    }

    console.log(`✅ Found ${candidates.length} candidates`)
    candidates.forEach(candidate => {
      console.log(`  - ${candidate.first_name} ${candidate.last_name} (${candidate.email})`)
    })

    // Test 2: Create a new candidate
    console.log('\n👤 Test 2: Creating new candidate...')
    const testCandidate = {
      first_name: 'Test',
      last_name: 'User',
      email: `test.user.${Date.now()}@example.com`,
      phone: '555-TEST',
      notes: 'Test candidate created by automated test'
    }

    const { data: newCandidate, error: createError } = await supabase
      .from('candidates')
      .insert(testCandidate)
      .select()
      .single()

    if (createError) {
      console.error('❌ Create failed:', createError.message)
      return
    }

    console.log(`✅ Created candidate: ${newCandidate.first_name} ${newCandidate.last_name} (ID: ${newCandidate.id})`)

    // Test 3: Update the candidate
    console.log('\n✏️  Test 3: Updating candidate...')
    const updatedData = {
      notes: 'Updated notes - test completed successfully'
    }

    const { data: updatedCandidate, error: updateError } = await supabase
      .from('candidates')
      .update(updatedData)
      .eq('id', newCandidate.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      return
    }

    console.log(`✅ Updated candidate notes: ${updatedCandidate.notes}`)

    // Test 4: Search candidates
    console.log('\n🔍 Test 4: Searching candidates...')
    const { data: searchResults, error: searchError } = await supabase
      .from('candidates')
      .select('*')
      .or(`first_name.ilike.%${testCandidate.first_name}%,last_name.ilike.%${testCandidate.last_name}%,email.ilike.%${testCandidate.email}%`)
      .order('created_at', { ascending: false })

    if (searchError) {
      console.error('❌ Search failed:', searchError.message)
      return
    }

    console.log(`✅ Search found ${searchResults.length} matching candidates`)

    // Test 5: Delete the test candidate
    console.log('\n🗑️  Test 5: Cleaning up test candidate...')
    const { error: deleteError } = await supabase
      .from('candidates')
      .delete()
      .eq('id', newCandidate.id)

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
      return
    }

    console.log('✅ Test candidate deleted successfully')

    // Final verification
    console.log('\n🔍 Final verification: Checking candidate count...')
    const { data: finalCandidates, error: finalError } = await supabase
      .from('candidates')
      .select('*')

    if (finalError) {
      console.error('❌ Final check failed:', finalError.message)
      return
    }

    console.log(`✅ Database now contains ${finalCandidates.length} candidates`)
    console.log('\n🎉 All tests passed! Candidate management system is working correctly.')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testCandidateOperations()