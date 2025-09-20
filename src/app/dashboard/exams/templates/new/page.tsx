'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { CreateExamTemplateData, ExamType, BundledTiming } from "@/lib/types/exams"
import { createExamTemplate } from "@/lib/actions/exams"
import { getOfferings } from "@/lib/actions/offerings"

interface CourseOffering {
  id: string
  name: string
  type: string
  wset_level?: number
  metadata?: Record<string, any>
}

export default function NewExamTemplatePage() {
  const router = useRouter()
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateExamTemplateData>({
    course_offering_id: '',
    name: '',
    exam_type: 'combined',
    duration_minutes: 60,
    pass_mark_percentage: 55,
    max_score: 100,
    is_bundled_with_course: true,
    bundled_timing: 'final_day',
    can_schedule_independently: false,
    scheduling_window_days: 365,
    allows_resits: true,
    allows_enquiries: true,
    makeup_fee: 75,
    resit_fee: 75,
    remote_invigilation_fee: 50,
    enquiry_fee: 50,
    active: true,
    metadata: {}
  })

  useEffect(() => {
    loadCourseOfferings()
  }, [])

  const loadCourseOfferings = async () => {
    try {
      setLoading(true)
      const data = await getOfferings('wset_course')
      setCourseOfferings(data.filter((offering: CourseOffering) => offering.type === 'wset_course'))
    } catch (error) {
      console.error('Failed to load course offerings:', error)
      setError('Failed to load course offerings')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseChange = (courseId: string) => {
    const course = courseOfferings.find(c => c.id === courseId)
    if (!course) return

    // Auto-populate template name and settings based on course
    let templateName = `${course.name} Exam`
    let examType: ExamType = 'combined'
    let duration = 60
    let passMarkPercentage = 55
    let bundledTiming: BundledTiming = 'final_day'
    let makeupFee = 75
    let resitFee = 75
    let remoteInvigilationFee = 50
    let canScheduleIndependently = false

    // WSET-specific defaults based on level
    if (course.wset_level) {
      switch (course.wset_level) {
        case 1:
          templateName = `Level 1 Combined Exam`
          examType = 'combined'
          duration = 45
          bundledTiming = 'same_day'
          canScheduleIndependently = course.metadata?.course_format === 'online'
          break
        case 2:
          templateName = `Level 2 Theory Exam`
          examType = 'theory'
          duration = 60
          makeupFee = 85
          resitFee = 85
          remoteInvigilationFee = 60
          canScheduleIndependently = course.metadata?.course_format === 'online'
          break
        case 3:
          templateName = `Level 3 Theory Exam`
          examType = 'theory'
          duration = 120
          makeupFee = 125
          resitFee = 125
          remoteInvigilationFee = 90
          canScheduleIndependently = course.metadata?.course_format === 'online'
          break
        case 4:
          templateName = `Level 4 Theory Exam`
          examType = 'theory'
          duration = 180
          makeupFee = 150
          resitFee = 150
          remoteInvigilationFee = 100
          canScheduleIndependently = course.metadata?.course_format === 'online'
          break
      }
    }

    setFormData(prev => ({
      ...prev,
      course_offering_id: courseId,
      name: templateName,
      exam_type: examType,
      duration_minutes: duration,
      pass_mark_percentage: passMarkPercentage,
      bundled_timing: bundledTiming,
      makeup_fee: makeupFee,
      resit_fee: resitFee,
      remote_invigilation_fee: remoteInvigilationFee,
      can_schedule_independently: canScheduleIndependently
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.course_offering_id) {
      setError('Please select a course offering')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const template = await createExamTemplate(formData)
      router.push(`/dashboard/exams/templates/${template.id}`)
    } catch (error) {
      console.error('Failed to create exam template:', error)
      setError('Failed to create exam template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedCourse = courseOfferings.find(c => c.id === formData.course_offering_id)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Exam Template</h1>
            <p className="text-muted-foreground">Loading course offerings...</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/exams/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Exam Template</h1>
          <p className="text-muted-foreground">
            Define an exam template for a course offering
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course Offering</Label>
                  <Select value={formData.course_offering_id} onValueChange={handleCourseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course offering" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOfferings.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span>{course.name}</span>
                            {course.wset_level && (
                              <Badge variant="outline" className="text-xs">
                                Level {course.wset_level}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter exam template name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam_type">Exam Type</Label>
                    <Select
                      value={formData.exam_type}
                      onValueChange={(value: ExamType) => setFormData(prev => ({ ...prev, exam_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory Only</SelectItem>
                        <SelectItem value="tasting">Tasting Only</SelectItem>
                        <SelectItem value="combined">Combined (Theory + Tasting)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                      min="15"
                      max="300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass_mark">Pass Mark (%)</Label>
                    <Input
                      id="pass_mark"
                      type="number"
                      value={formData.pass_mark_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, pass_mark_percentage: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_score">Maximum Score</Label>
                    <Input
                      id="max_score"
                      type="number"
                      value={formData.max_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 0 }))}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Bundling & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bundled">Bundle with Course</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create exam sessions when course sessions are scheduled
                    </p>
                  </div>
                  <Switch
                    id="bundled"
                    checked={formData.is_bundled_with_course}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bundled_with_course: checked }))}
                  />
                </div>

                {formData.is_bundled_with_course && (
                  <div className="space-y-2">
                    <Label htmlFor="bundled_timing">Bundled Timing</Label>
                    <Select
                      value={formData.bundled_timing || 'final_day'}
                      onValueChange={(value: BundledTiming) => setFormData(prev => ({ ...prev, bundled_timing: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same_day">Same Day as Course</SelectItem>
                        <SelectItem value="final_day">Final Day of Course</SelectItem>
                        <SelectItem value="separate_day">Day After Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="independent">Allow Independent Scheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can schedule this exam independently (for online courses)
                    </p>
                  </div>
                  <Switch
                    id="independent"
                    checked={formData.can_schedule_independently}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_schedule_independently: checked }))}
                  />
                </div>

                {formData.can_schedule_independently && (
                  <div className="space-y-2">
                    <Label htmlFor="window">Scheduling Window (days)</Label>
                    <Input
                      id="window"
                      type="number"
                      value={formData.scheduling_window_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduling_window_days: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="730"
                      placeholder="365"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long students have to schedule their exam after course enrollment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exam Services */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Services & Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="resits">Allow Resits</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can retake this exam if they fail
                    </p>
                  </div>
                  <Switch
                    id="resits"
                    checked={formData.allows_resits}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_resits: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enquiries">Allow Enquiries</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can challenge exam results
                    </p>
                  </div>
                  <Switch
                    id="enquiries"
                    checked={formData.allows_enquiries}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_enquiries: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="makeup_fee">Makeup Fee (£)</Label>
                    <Input
                      id="makeup_fee"
                      type="number"
                      value={formData.makeup_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, makeup_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="75.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resit_fee">Resit Fee (£)</Label>
                    <Input
                      id="resit_fee"
                      type="number"
                      value={formData.resit_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, resit_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="75.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invigilation_fee">Remote Invigilation Fee (£)</Label>
                    <Input
                      id="invigilation_fee"
                      type="number"
                      value={formData.remote_invigilation_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, remote_invigilation_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enquiry_fee">Enquiry Fee (£)</Label>
                    <Input
                      id="enquiry_fee"
                      type="number"
                      value={formData.enquiry_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, enquiry_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Course Info */}
            {selectedCourse && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{selectedCourse.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedCourse.wset_level && (
                        <Badge variant="outline">Level {selectedCourse.wset_level}</Badge>
                      )}
                      <Badge variant="secondary">{selectedCourse.type}</Badge>
                    </div>
                  </div>

                  {selectedCourse.metadata?.course_format && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Format:</p>
                      <p className="capitalize">{selectedCourse.metadata.course_format}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Template Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name:</p>
                  <p className="font-medium">{formData.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type & Duration:</p>
                  <p className="font-medium">
                    {formData.exam_type} • {formData.duration_minutes} min
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pass Mark:</p>
                  <p className="font-medium">{formData.pass_mark_percentage}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bundling:</p>
                  <p className="font-medium">
                    {formData.is_bundled_with_course
                      ? `Bundled (${formData.bundled_timing?.replace('_', ' ')})`
                      : 'Not bundled'
                    }
                  </p>
                </div>
                {formData.can_schedule_independently && (
                  <div>
                    <p className="text-muted-foreground">Independent Scheduling:</p>
                    <p className="font-medium">{formData.scheduling_window_days} days</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Help
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  <strong>Bundled exams</strong> are automatically created when course sessions are scheduled.
                </p>
                <p className="text-muted-foreground">
                  <strong>Independent scheduling</strong> allows online course students to book their own exam times.
                </p>
                <p className="text-muted-foreground">
                  Fee settings determine pricing for makeup exams, resits, and other services.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/exams/templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving || !formData.course_offering_id || !formData.name}>
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}