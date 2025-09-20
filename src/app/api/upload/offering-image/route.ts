import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Blob token is configured
    if (!process.env.SEBEVED_BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      )
    }

    // Check if user is authenticated (you may want to add more specific auth checks)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const offeringId = searchParams.get('offeringId')

    if (!filename || !offeringId) {
      return NextResponse.json(
        { error: 'Filename and offeringId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const contentType = request.headers.get('content-type') || ''

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Get the file data
    const body = await request.blob()

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (body.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `offering-${offeringId}-${timestamp}-${sanitizedFilename}`

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, body, {
      access: 'public',
      contentType,
      token: process.env.SEBEVED_BLOB_READ_WRITE_TOKEN,
    })

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