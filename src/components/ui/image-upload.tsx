'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (url: string | null) => void
  onMetadataChange?: (metadata: ImageMetadata | null) => void
  label?: string
  required?: boolean
  className?: string
  maxSize?: number // in MB
  acceptedTypes?: string[]
  placeholder?: string
  entityId?: string // For unique filenames (e.g., offering ID)
  entityType?: string // For organizing uploads (e.g., 'offering')
}

interface ImageMetadata {
  url: string
  size: number
  contentType: string
  uploadedAt: string
  pathname: string
}

export function ImageUpload({
  value,
  onChange,
  onMetadataChange,
  label = "Image",
  required = false,
  className = "",
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  placeholder = "Upload an image...",
  entityId,
  entityType = 'general'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value || null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use ${acceptedTypes.join(', ')}`
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        filename: file.name,
        ...(entityId && { [`${entityType}Id`]: entityId })
      })

      const response = await fetch(`/api/upload/${entityType}-image?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const metadata: ImageMetadata = await response.json()

      setPreview(metadata.url)
      onChange(metadata.url)
      onMetadataChange?.(metadata)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const removeImage = () => {
    setPreview(null)
    onChange(null)
    onMetadataChange?.(null)
    setError(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <Card className={cn(
        "relative border-2 border-dashed transition-colors",
        dragActive && "border-primary bg-primary/10",
        error && "border-red-300",
        "hover:border-gray-400"
      )}>
        <CardContent className="p-6">
          {preview ? (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col items-center justify-center space-y-4 py-8",
                "transition-colors",
                dragActive && "text-primary"
              )}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Uploading image...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">{placeholder}</p>
                    <p className="text-xs text-gray-500">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Max {maxSize}MB • {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {!preview && (
            <div className="mt-4">
              <Input
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileSelect(file)
                  }
                }}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}

      {preview && !uploading && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = acceptedTypes.join(',')
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  handleFileSelect(file)
                }
              }
              input.click()
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Replace Image
          </Button>
        </div>
      )}
    </div>
  )
}