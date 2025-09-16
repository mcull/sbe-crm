'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { createCourseSession, updateCourseSession } from '@/lib/actions/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type CourseSession = {
  id: string
  course_id: string
  start_date: string
  end_date: string
  instructor: string | null
  location: string | null
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  courses: {
    name: string
    wset_level: number
    max_capacity: number
  } | null
}

interface SessionFormProps {
  courses: Course[]
  session?: CourseSession
}

export default function SessionForm({ courses, session }: SessionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>(session?.course_id || '')
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      if (session) {
        await updateCourseSession(session.id, formData)
      } else {
        await createCourseSession(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)

    const course = courses.find(c => c.id === courseId)
    if (course && !session) {
      // Auto-calculate end date based on course duration
      const startDateInput = document.getElementById('start_date') as HTMLInputElement
      const endDateInput = document.getElementById('end_date') as HTMLInputElement

      if (startDateInput.value && endDateInput) {
        const startDate = new Date(startDateInput.value)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + (course.duration_weeks * 7) - 1)
        endDateInput.value = endDate.toISOString().split('T')[0]
      }
    }
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedCourse && !session) {
      const course = courses.find(c => c.id === selectedCourse)
      if (course) {
        const startDate = new Date(e.target.value)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + (course.duration_weeks * 7) - 1)

        const endDateInput = document.getElementById('end_date') as HTMLInputElement
        if (endDateInput) {
          endDateInput.value = endDate.toISOString().split('T')[0]
        }
      }
    }
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="course_id">
          Course <span className="text-destructive">*</span>
        </Label>
        <Select name="course_id" value={selectedCourse} onValueChange={handleCourseChange} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name} (Level {course.wset_level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourseData && (
          <p className="text-sm text-muted-foreground">
            Duration: {selectedCourseData.duration_weeks} week{selectedCourseData.duration_weeks !== 1 ? 's' : ''} •
            Capacity: {selectedCourseData.max_capacity} students
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={session?.start_date || ''}
            onChange={handleStartDateChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={session?.end_date || ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor</Label>
          <Input
            id="instructor"
            name="instructor"
            defaultValue={session?.instructor || ''}
            placeholder="Instructor name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={session?.location || ''}
            placeholder="SBE Education Center, Atlanta"
          />
        </div>
      </div>

      {session && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={session.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
          {session ? 'Update' : 'Schedule'} Session
        </Button>
      </div>
    </form>
  )
}