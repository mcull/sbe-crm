'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { updateCourseTemplate } from '@/lib/actions/course-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Save } from 'lucide-react'

type CourseTemplate = Database['public']['Tables']['course_templates']['Row']

interface CourseTemplateFormProps {
  template: CourseTemplate
}

export default function CourseTemplateForm({ template }: CourseTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await updateCourseTemplate(template.wset_level, formData)
      setSuccess(true)
      // Refresh the page to show updated values
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Template Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={template.name}
          placeholder="WSET Level X Award in Wines"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={template.description || ''}
          placeholder="Course description and learning objectives..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_weeks">
            Duration (weeks) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="duration_weeks"
            name="duration_weeks"
            type="number"
            min="1"
            required
            defaultValue={template.duration_weeks}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_capacity">
            Maximum Capacity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min="1"
            required
            defaultValue={template.max_capacity}
            placeholder="20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Default Price ($)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={template.price || ''}
          placeholder="599.00"
        />
        <p className="text-sm text-muted-foreground">
          Leave blank if no default price should be set
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Template updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </div>
    </form>
  )
}