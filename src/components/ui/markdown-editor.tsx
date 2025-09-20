'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Dynamic imports to avoid SSR issues with markdown editor
const MDEditor = dynamic(
  () => import('@uiw/react-markdown-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-64 border rounded-md bg-muted animate-pulse" />
  }
)

import dynamic from 'next/dynamic'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  error?: string
  height?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  label,
  required = false,
  className,
  error,
  height = 300
}: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-2">
        {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
        <div className="h-64 border rounded-md bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="border rounded-md overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview="edit"
          height={height}
          data-color-mode="light"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>**Bold**, *italic*, [link](url), `code`</p>
        <p>- List item, 1. Numbered item</p>
        <p># Heading, ## Subheading, ### Section</p>
      </div>
    </div>
  )
}

interface MarkdownPreviewProps {
  value: string
  className?: string
}

const MarkdownPreviewComponent = dynamic(
  () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
  { ssr: false }
)

export function MarkdownPreview({ value, className }: MarkdownPreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="animate-pulse bg-muted h-32 rounded" />
  }

  return (
    <div className={cn("text-sm", className)}>
      <MarkdownPreviewComponent source={value} />
    </div>
  )
}