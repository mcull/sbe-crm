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
import { ArrowLeft, Save, AlertCircle, Calendar, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { format, addHours } from "date-fns"
import { CreateExamSessionData, SessionType, ExamTemplate } from "@/lib/types/exams"
import { createExamSession } from "@/lib/actions/exams"
import { getExamTemplates } from "@/lib/actions/exams"
import { getSessions } from "@/lib/actions/sessions"

interface CourseSession {
  id: string
  name?: string
  session_date: string
  location?: string
  max_capacity: number
  offerings?: {
    id: string
    name: string
    wset_level?: number
  }
}

export default function NewExamSessionPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ExamTemplate[]>([])
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateExamSessionData>({
    exam_template_id: '',
    exam_date: '',
    max_capacity: 30,
    session_type: 'standalone',
    delivery_method: 'in_person',
    booking_enabled: true,
    metadata: {}
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [templatesData, sessionsData] = await Promise.all([
        getExamTemplates(),
        getSessions({ limit: 100 })
      ])

      setTemplates(templatesData)
      setCourseSessions(sessionsData)
    } catch (error) {
      console.error('Failed to load initial data:', error)
      setError('Failed to load required data')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // Auto-populate session name and settings
    const sessionName = `${template.name} - ${format(new Date(), 'MMM d, yyyy')}`

    // Calculate end time based on duration
    const examDate = new Date(formData.exam_date || new Date())
    const endTime = addHours(examDate, Math.ceil(template.duration_minutes / 60))

    setFormData(prev => ({
      ...prev,
      exam_template_id: templateId,
      name: sessionName,
      exam_end_time: endTime.toISOString().slice(0, 16), // Format for datetime-local input
    }))
  }

  const handleCourseSessionChange = (courseSessionId: string) => {
    const courseSession = courseSessions.find(s => s.id === courseSessionId)
    if (!courseSession) return

    setFormData(prev => ({
      ...prev,
      course_session_id: courseSessionId,
      exam_date: courseSession.session_date,
      location: courseSession.location,
      max_capacity: courseSession.max_capacity,
      session_type: 'bundled'
    }))
  }

  const handleDateTimeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      exam_date: value
    }))

    // Auto-calculate end time if template is selected
    const template = templates.find(t => t.id === formData.exam_template_id)
    if (template && value) {
      const examDate = new Date(value)
      const endTime = addHours(examDate, Math.ceil(template.duration_minutes / 60))
      setFormData(prev => ({
        ...prev,
        exam_end_time: endTime.toISOString().slice(0, 16)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.exam_template_id || !formData.exam_date) {
      setError('Please select a template and exam date')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Convert datetime-local format to ISO string
      const sessionData = {
        ...formData,
        exam_date: new Date(formData.exam_date).toISOString(),
        exam_end_time: formData.exam_end_time ? new Date(formData.exam_end_time).toISOString() : undefined
      }

      const session = await createExamSession(sessionData)
      router.push(`/dashboard/exams/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to create exam session:', error)
      setError('Failed to create exam session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === formData.exam_template_id)
  const selectedCourseSession = courseSessions.find(s => s.id === formData.course_session_id)

  const availableCourseSessions = courseSessions.filter(session => {
    if (!selectedTemplate) return false
    return session.offerings?.id === selectedTemplate.course_offering_id
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Schedule Exam Session</h1>
            <p className="text-muted-foreground">Loading exam templates...</p>
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
          <Link href="/dashboard/exams/sessions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Schedule Exam Session</h1>
          <p className="text-muted-foreground">
            Create a new exam session for students to register
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
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Select Exam Template</Label>
                  <Select value={formData.exam_template_id} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an exam template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {template.exam_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.duration_minutes}min
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <h4 className="font-medium">{selectedTemplate.name}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Course:</p>
                        <p>{selectedTemplate.course_offering?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration:</p>
                        <p>{selectedTemplate.duration_minutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pass Mark:</p>
                        <p>{selectedTemplate.pass_mark_percentage}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Type & Course Linking */}
            <Card>
              <CardHeader>
                <CardTitle>Session Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_type">Session Type</Label>
                  <Select
                    value={formData.session_type}
                    onValueChange={(value: SessionType) => setFormData(prev => ({ ...prev, session_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bundled">Bundled (with course session)</SelectItem>
                      <SelectItem value="makeup">Makeup Exam</SelectItem>
                      <SelectItem value="resit">Resit Exam</SelectItem>
                      <SelectItem value="remote_invigilation">Remote Invigilation</SelectItem>
                      <SelectItem value="standalone">Standalone Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.session_type === 'bundled' && selectedTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="course_session">Course Session</Label>
                    <Select value={formData.course_session_id || ''} onValueChange={handleCourseSessionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course session to bundle with" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourseSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <span>{session.name || 'Unnamed Session'}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(session.session_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Session Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Auto-generated from template and date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional information about this exam session"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam_date">Exam Date & Time</Label>
                    <Input
                      id="exam_date"
                      type="datetime-local"
                      value={formData.exam_date}
                      onChange={(e) => handleDateTimeChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exam_end_time">End Time (optional)</Label>
                    <Input
                      id="exam_end_time"
                      type="datetime-local"
                      value={formData.exam_end_time || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, exam_end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Exam venue or online platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proctor">Proctor/Invigilator (optional)</Label>
                  <Input
                    id="proctor"
                    value={formData.proctor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, proctor: e.target.value }))}
                    placeholder="Name of exam proctor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Capacity & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Maximum Capacity</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_method">Delivery Method</Label>
                    <Select
                      value={formData.delivery_method}
                      onValueChange={(value: 'in_person' | 'online' | 'hybrid') =>
                        setFormData(prev => ({ ...prev, delivery_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_deadline">Registration Deadline (optional)</Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="booking_enabled">Enable Booking</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to register for this exam session
                    </p>
                  </div>
                  <Switch
                    id="booking_enabled"
                    checked={formData.booking_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, booking_enabled: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Template:</p>
                  <p className="font-medium">{selectedTemplate?.name || 'Not selected'}</p>
                </div>

                {formData.exam_date && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Date & Time:</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(formData.exam_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {formData.exam_end_time && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>End Time:</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(formData.exam_end_time), 'h:mm a')}
                    </p>
                  </div>
                )}

                {formData.location && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Location:</span>
                    </div>
                    <p className="font-medium">{formData.location}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity:</span>
                  </div>
                  <p className="font-medium">{formData.max_capacity} students</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Type:</p>
                  <Badge className="mt-1">
                    {formData.session_type.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <p className="text-muted-foreground">Delivery:</p>
                  <p className="font-medium capitalize">{formData.delivery_method.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Course Session Info */}
            {selectedCourseSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Linked Course Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">{selectedCourseSession.name}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedCourseSession.session_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Course:</p>
                    <p className="font-medium">{selectedCourseSession.offerings?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location:</p>
                    <p className="font-medium">{selectedCourseSession.location || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/exams/sessions">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={saving || !formData.exam_template_id || !formData.exam_date}
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Session
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}