'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { createExam, updateExam } from '@/lib/actions/exams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Calendar, MapPin, Users, FileText, Clock } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type Exam = Database['public']['Tables']['exams']['Row'] & {
  courses: {
    id: string
    name: string
    wset_level: number
  } | null
}

interface ExamFormProps {
  exam?: Exam
  courses: Course[]
}

const examTypes = [
  { value: 'theory', label: '📚 Theory Exam', description: 'Written examination testing wine knowledge' },
  { value: 'tasting', label: '🍷 Tasting Exam', description: 'Blind tasting and sensory evaluation' },
  { value: 'practical', label: '🔧 Practical Exam', description: 'Hands-on skills assessment' },
] as const

// WSET compliance requirements from the workflow analysis
const wsetRequirements = {
  theory: {
    duration: '90 minutes',
    materials: ['Answer sheets', 'Pens', 'Calculators (if permitted)'],
    setup: 'Exam hall with individual desks',
    invigilation: 'Minimum 1 invigilator per 30 candidates'
  },
  tasting: {
    duration: '30-45 minutes',
    materials: ['Wine glasses', 'Tasting sheets', 'Water', 'Crackers', 'Spittoons'],
    setup: 'Individual tasting stations',
    invigilation: 'Minimum 1 invigilator per 20 candidates'
  },
  practical: {
    duration: '60-90 minutes',
    materials: ['Service equipment', 'Assessment sheets', 'Wine samples'],
    setup: 'Service stations with equipment',
    invigilation: 'Minimum 1 invigilator per 15 candidates'
  }
}

export default function ExamForm({ exam, courses }: ExamFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedExamType, setSelectedExamType] = useState<'theory' | 'tasting' | 'practical' | null>(
    (exam?.exam_type as 'theory' | 'tasting' | 'practical') || null
  )
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      if (exam) {
        await updateExam(exam.id, formData)
      } else {
        await createExam(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  // Calculate minimum exam date (7-10 working days from today for WSET compliance)
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 10) // 10 working days minimum for theory/tasting
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Course Selection */}
      <div className="space-y-2">
        <Label htmlFor="course_id">
          WSET Course <span className="text-destructive">*</span>
        </Label>
        <Select name="course_id" defaultValue={exam?.course_id || ''} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                Level {course.wset_level}: {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Type */}
        <div className="space-y-2">
          <Label htmlFor="exam_type">
            Exam Type <span className="text-destructive">*</span>
          </Label>
          <Select
            name="exam_type"
            defaultValue={exam?.exam_type || ''}
            required
            onValueChange={(value) => setSelectedExamType(value as 'theory' | 'tasting' | 'practical')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Candidates */}
        <div className="space-y-2">
          <Label htmlFor="max_candidates">
            Maximum Candidates <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="max_candidates"
              name="max_candidates"
              type="number"
              min="1"
              max="50"
              required
              className="pl-8"
              defaultValue={exam?.max_candidates || '20'}
              placeholder="20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Date */}
        <div className="space-y-2">
          <Label htmlFor="exam_date">
            Exam Date <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="exam_date"
              name="exam_date"
              type="datetime-local"
              required
              className="pl-8"
              min={minDateString + 'T09:00'}
              defaultValue={exam?.exam_date ?
                new Date(exam.exam_date).toISOString().slice(0, 16) :
                ''
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Minimum 10 working days notice required for WSET compliance
          </p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">
            Location <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              name="location"
              required
              className="pl-8"
              defaultValue={exam?.location || ''}
              placeholder="Southeastern Beverage Education - Main Hall"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">
          <FileText className="inline h-4 w-4 mr-1" />
          Special Instructions
        </Label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={4}
          defaultValue={exam?.instructions || ''}
          placeholder="Any special instructions for candidates or invigilators..."
        />
      </div>

      {/* WSET Compliance Information */}
      {selectedExamType && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              WSET Compliance Requirements - {examTypes.find(t => t.value === selectedExamType)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><strong>Duration:</strong> {wsetRequirements[selectedExamType].duration}</div>
            <div><strong>Setup:</strong> {wsetRequirements[selectedExamType].setup}</div>
            <div><strong>Invigilation:</strong> {wsetRequirements[selectedExamType].invigilation}</div>
            <div>
              <strong>Required Materials:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                {wsetRequirements[selectedExamType].materials.map((material, index) => (
                  <li key={index}>{material}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
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
          {exam ? 'Update' : 'Schedule'} Exam
        </Button>
      </div>
    </form>
  )
}