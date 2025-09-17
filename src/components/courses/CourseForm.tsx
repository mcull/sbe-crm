'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { createCourse, updateCourse } from '@/lib/actions/courses'
import { getCourseTemplate } from '@/lib/actions/course-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type CourseTemplate = Database['public']['Tables']['course_templates']['Row']

interface CourseFormProps {
  course?: Course
}

export default function CourseForm({ course }: CourseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>(course?.wset_level?.toString() || '')
  const [templates, setTemplates] = useState<Record<string, CourseTemplate>>({})
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      if (course) {
        await updateCourse(course.id, formData)
      } else {
        await createCourse(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  // Load templates from database on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateData: Record<string, CourseTemplate> = {}
        // Load templates for all WSET levels
        for (let i = 1; i <= 4; i++) {
          try {
            const template = await getCourseTemplate(i)
            templateData[i.toString()] = template
          } catch {
            // Template might not exist, skip
          }
        }
        setTemplates(templateData)
      } catch (err) {
        console.error('Failed to load course templates:', err)
      }
    }

    loadTemplates()
  }, [])

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level)

    // Auto-populate form fields when a level is selected
    if (level && !course) {
      const template = templates[level]
      if (template) {
        // Update form fields
        const nameInput = document.getElementById('name') as HTMLInputElement
        const descInput = document.getElementById('description') as HTMLTextAreaElement
        const durationInput = document.getElementById('duration_weeks') as HTMLInputElement
        const capacityInput = document.getElementById('max_capacity') as HTMLInputElement
        const priceInput = document.getElementById('price') as HTMLInputElement

        if (nameInput) nameInput.value = template.name
        if (descInput) descInput.value = template.description || ''
        if (durationInput) durationInput.value = template.duration_weeks.toString()
        if (capacityInput) capacityInput.value = template.max_capacity.toString()
        if (priceInput && template.price) priceInput.value = template.price.toString()
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wset_level">
            WSET Level <span className="text-destructive">*</span>
          </Label>
          <Select name="wset_level" value={selectedLevel} onValueChange={handleLevelChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select WSET Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 - Introduction</SelectItem>
              <SelectItem value="2">Level 2 - Intermediate</SelectItem>
              <SelectItem value="3">Level 3 - Advanced</SelectItem>
              <SelectItem value="4">Level 4 - Diploma</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            defaultValue={course?.duration_weeks || ''}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Course Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={course?.name || ''}
          placeholder="WSET Level 1 Award in Wines"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={course?.description || ''}
          placeholder="Course description and learning objectives..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={course?.price || ''}
            placeholder="599.00"
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
            defaultValue={course?.max_capacity || ''}
            placeholder="20"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
          {course ? 'Update' : 'Create'} Course
        </Button>
      </div>
    </form>
  )
}