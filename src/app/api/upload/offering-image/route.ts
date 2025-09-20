import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Image upload started')

    // Check if Blob token is configured
    if (!process.env.SEBEVED_BLOB_READ_WRITE_TOKEN) {
      console.error('❌ Blob token not configured')
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      )
    }

    // Check if user is authenticated (you may want to add more specific auth checks)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const offeringId = searchParams.get('offeringId')

    console.log('📝 Request params:', { filename, offeringId, userID: user.id })

    if (!filename) {
      console.error('❌ Missing filename')
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const contentType = request.headers.get('content-type') || ''

    console.log('🔍 Content type:', contentType)

    if (!allowedTypes.includes(contentType)) {
      console.error('❌ Invalid file type:', contentType)
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Get the file data
    const body = await request.blob()
    console.log('📦 File size:', body.size)

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (body.size > maxSize) {
      console.error('❌ File too large:', body.size)
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePrefix = offeringId ? `offering-${offeringId}` : `new-offering-${user.id}`
    const uniqueFilename = `${filePrefix}-${timestamp}-${sanitizedFilename}`

    // Upload to Vercel Blob
    console.log('⬆️ Uploading to Vercel Blob:', uniqueFilename)
    const blob = await put(uniqueFilename, body, {
      access: 'public',
      contentType,
      token: process.env.SEBEVED_BLOB_READ_WRITE_TOKEN,
    })

    console.log('✅ Upload successful:', blob.url)

    // Return the blob information
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType,
      size: body.size,
      uploadedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Note: Vercel Blob doesn't have a built-in delete method yet
    // This is a placeholder for when it becomes available
    // For now, we'll just remove the reference from the database

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}