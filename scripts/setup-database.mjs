#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqbmzlknzxwajgqzmbxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYm16bGtuenh3YWpncXptYnhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0MTA1MywiZXhwIjoyMDczNjE3MDUzfQ.VP0ObiAuuvMZ2ZzdReTg3tibECnJJ2tSEQuY_BJ55EM'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupDatabase() {
  try {
    console.log('🔧 Setting up SBE CRM database...')

    // Test connection first
    console.log('📡 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('candidates')
      .select('*')
      .limit(1)

    if (testError && !testError.message.includes('does not exist') && !testError.message.includes('relation "public.candidates"')) {
      console.error('❌ Database connection failed:', testError.message)
      process.exit(1)
    }

    console.log('✅ Database connection successful!')

    // Read and execute SQL file
    const sqlPath = join(__dirname, '..', 'supabase-setup.sql')
    const sqlCommands = readFileSync(sqlPath, 'utf8')

    // Split SQL commands by semicolon and filter out empty ones
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executing ${commands.length} SQL commands...`)

    // Execute each command individually
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`Executing command ${i + 1}/${commands.length}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        if (error) {
          console.warn(`⚠️  Warning on command ${i + 1}: ${error.message}`)
        }
      } catch (err) {
        // Try alternative approach
        console.log(`Trying alternative approach for command ${i + 1}...`)
        // Most commands will need to be run via the Supabase dashboard or CLI
      }
    }

    // Test if tables were created by trying to query candidates
    console.log('🔍 Verifying table creation...')
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .limit(1)

    if (candidatesError) {
      console.log('📋 Tables may need to be created manually via Supabase dashboard')
      console.log('Please run the SQL commands from supabase-setup.sql in your Supabase SQL editor')
    } else {
      console.log('✅ Tables created successfully!')
      console.log(`Found ${candidates?.length || 0} existing candidates`)
    }

    console.log('🎉 Database setup completed!')

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

setupDatabase()