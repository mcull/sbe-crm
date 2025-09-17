#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqbmzlknzxwajgqzmbxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYm16bGtuenh3YWpncXptYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0MTA1MywiZXhwIjoyMDczNjE3MDUzfQ.VP0ObiAuuvMZ2ZzdReTg3tibECnJJ2tSEQuY_BJ55EM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testExamOperations() {
  console.log('🧪 Testing exam management operations...')

  try {
    // Test 1: Get all exams with course information
    console.log('\n📋 Test 1: Fetching exams with course details...')
    const { data: exams, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError.message)
      return
    }

    console.log(`✅ Found ${exams.length} exams`)
    exams.forEach(exam => {
      const examDate = new Date(exam.exam_date)
      const status = examDate > new Date() ? '📅 Upcoming' : '✅ Completed'
      console.log(`  ${status} - ${exam.courses?.name} (Level ${exam.courses?.wset_level})`)
      console.log(`    Type: ${exam.exam_type} | Date: ${examDate.toLocaleDateString()} | Capacity: ${exam.current_registrations}/${exam.max_candidates}`)
    })

    // Test 2: Check exam statistics
    console.log('\n📊 Test 2: Calculating exam statistics...')
    const now = new Date()
    const upcomingExams = exams.filter(exam => new Date(exam.exam_date) > now)
    const completedExams = exams.filter(exam => new Date(exam.exam_date) <= now)
    const totalCapacity = upcomingExams.reduce((sum, exam) => sum + exam.max_candidates, 0)
    const totalRegistered = upcomingExams.reduce((sum, exam) => sum + (exam.current_registrations || 0), 0)

    console.log(`✅ Upcoming exams: ${upcomingExams.length}`)
    console.log(`✅ Completed exams: ${completedExams.length}`)
    console.log(`✅ Total capacity: ${totalCapacity} seats`)
    console.log(`✅ Current registrations: ${totalRegistered} candidates`)
    console.log(`✅ Availability: ${totalCapacity - totalRegistered} seats remaining`)

    // Test 3: Test exam type distribution
    console.log('\n📝 Test 3: Exam type distribution...')
    const examTypes = exams.reduce((acc, exam) => {
      acc[exam.exam_type] = (acc[exam.exam_type] || 0) + 1
      return acc
    }, {})

    Object.entries(examTypes).forEach(([type, count]) => {
      const icon = type === 'theory' ? '📚' : type === 'tasting' ? '🍷' : '🔧'
      console.log(`  ${icon} ${type}: ${count} exams`)
    })

    // Test 4: Check WSET compliance (10 working days advance notice)
    console.log('\n⚠️  Test 4: WSET compliance check...')
    const tenWorkingDaysFromNow = new Date(now)
    tenWorkingDaysFromNow.setDate(now.getDate() + 14) // Approx 10 working days

    const nonCompliantExams = upcomingExams.filter(exam =>
      new Date(exam.exam_date) < tenWorkingDaysFromNow
    )

    if (nonCompliantExams.length > 0) {
      console.log(`⚠️  ${nonCompliantExams.length} exams may not meet WSET 10-day notice requirement:`)
      nonCompliantExams.forEach(exam => {
        const daysUntil = Math.ceil((new Date(exam.exam_date) - now) / (1000 * 60 * 60 * 24))
        console.log(`    - ${exam.courses?.name} ${exam.exam_type} in ${daysUntil} days`)
      })
    } else {
      console.log('✅ All upcoming exams meet WSET compliance requirements')
    }

    // Test 5: Capacity utilization
    console.log('\n🎯 Test 5: Capacity utilization analysis...')
    upcomingExams.forEach(exam => {
      const utilization = exam.max_candidates > 0 ?
        ((exam.current_registrations || 0) / exam.max_candidates * 100).toFixed(1) : '0'
      const status = utilization >= 90 ? '🔴 Nearly Full' :
                   utilization >= 70 ? '🟡 Good' : '🟢 Available'
      console.log(`  ${exam.courses?.name} ${exam.exam_type}: ${utilization}% ${status}`)
    })

    console.log('\n🎉 All exam management tests completed successfully!')
    console.log('📍 Access exam management at: http://localhost:3004/dashboard/exams')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testExamOperations()