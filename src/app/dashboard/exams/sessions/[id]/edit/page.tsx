'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, AlertCircle, Info, Trash2, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { format, addHours } from "date-fns"
import { ExamSession, UpdateExamSessionData, SessionType, ExamSessionStatus } from "@/lib/types/exams"
import { getExamSession, updateExamSession } from "@/lib/actions/exams"

export default function EditExamSessionPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateExamSessionData>({})

  useEffect(() => {
    if (params.id) {
      loadSession(params.id as string)
    }
  }, [params.id])

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true)
      const sessionData = await getExamSession(sessionId)

      setSession(sessionData)

      // Initialize form with current session data
      setFormData({
        name: sessionData.name,
        description: sessionData.description,
        exam_date: sessionData.exam_date.slice(0, 16), // Format for datetime-local input
        exam_end_time: sessionData.exam_end_time?.slice(0, 16),
        location: sessionData.location,
        proctor: sessionData.proctor,
        delivery_method: sessionData.delivery_method,
        max_capacity: sessionData.max_capacity,
        session_type: sessionData.session_type,
        booking_enabled: sessionData.booking_enabled,
        registration_deadline: sessionData.registration_deadline?.slice(0, 16),
        status: sessionData.status,
        metadata: sessionData.metadata
      })
    } catch (error) {
      console.error('Failed to load session:', error)
      setError('Failed to load exam session')
    } finally {
      setLoading(false)
    }
  }

  const handleDateTimeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      exam_date: value
    }))

    // Auto-calculate end time if template duration is available
    if (session?.exam_template && value) {
      const examDate = new Date(value)
      const endTime = addHours(examDate, Math.ceil(session.exam_template.duration_minutes / 60))
      setFormData(prev => ({
        ...prev,
        exam_end_time: endTime.toISOString().slice(0, 16)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) return

    try {
      setSaving(true)
      setError(null)

      // Convert datetime-local format to ISO string
      const updateData = {
        ...formData,
        exam_date: formData.exam_date ? new Date(formData.exam_date).toISOString() : undefined,
        exam_end_time: formData.exam_end_time ? new Date(formData.exam_end_time).toISOString() : undefined,
        registration_deadline: formData.registration_deadline
          ? new Date(formData.registration_deadline).toISOString()
          : undefined
      }

      await updateExamSession(session.id, updateData)
      router.push(`/dashboard/exams/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to update exam session:', error)
      setError('Failed to update exam session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Check if form has changes
  const hasChanges = session && Object.keys(formData).some(key => {
    const formValue = formData[key as keyof UpdateExamSessionData]
    let sessionValue = session[key as keyof ExamSession]

    // Handle datetime comparisons
    if (key === 'exam_date' || key === 'exam_end_time' || key === 'registration_deadline') {
      if (sessionValue && typeof sessionValue === 'string') {
        sessionValue = sessionValue.slice(0, 16)
      }
    }

    return formValue !== sessionValue
  })

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'bundled': return 'bg-blue-100 text-blue-800'
      case 'makeup': return 'bg-yellow-100 text-yellow-800'
      case 'resit': return 'bg-orange-100 text-orange-800'
      case 'remote_invigilation': return 'bg-purple-100 text-purple-800'
      case 'standalone': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Exam Session</h1>
            <p className="text-muted-foreground">Loading session data...</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exams/sessions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Session Not Found</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/exams/sessions/${session.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Session
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Edit Exam Session</h1>
            <Badge className={getSessionTypeColor(session.session_type)}>
              {session.session_type.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {session.exam_template?.name} • {session.course_offering?.name}
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
                      value={formData.exam_date || ''}
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

            {/* Session Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_type">Session Type</Label>
                    <Select
                      value={formData.session_type || ''}
                      onValueChange={(value: SessionType) => setFormData(prev => ({ ...prev, session_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bundled">Bundled (with course)</SelectItem>
                        <SelectItem value="makeup">Makeup Exam</SelectItem>
                        <SelectItem value="resit">Resit Exam</SelectItem>
                        <SelectItem value="remote_invigilation">Remote Invigilation</SelectItem>
                        <SelectItem value="standalone">Standalone Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Session Status</Label>
                    <Select
                      value={formData.status || ''}
                      onValueChange={(value: ExamSessionStatus) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Maximum Capacity</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={formData.max_capacity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="200"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Current enrollment: {session.current_enrollment}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_method">Delivery Method</Label>
                    <Select
                      value={formData.delivery_method || ''}
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
                    checked={formData.booking_enabled ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, booking_enabled: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exam Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exam Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Link
                    href={`/dashboard/exams/templates/${session.exam_template?.id}`}
                    className="font-medium hover:underline"
                  >
                    {session.exam_template?.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{session.exam_template?.exam_type}</Badge>
                    <Badge variant="secondary">{session.exam_template?.duration_minutes} min</Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Pass Mark:</p>
                  <p className="font-medium">{session.exam_template?.pass_mark_percentage}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Session Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{session.current_enrollment}/{session.max_capacity}</p>
                    <p className="text-muted-foreground">enrolled</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{session.available_spots}</p>
                    <p className="text-muted-foreground">spots remaining</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground">Created:</p>
                  <p className="font-medium">{format(new Date(session.created_at), 'MMM d, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Changes Preview */}
            {hasChanges && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800">Unsaved Changes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-orange-700">
                  <p>You have unsaved changes to this session.</p>
                  <p className="mt-2">Remember to save your changes before leaving this page.</p>
                </CardContent>
              </Card>
            )}

            {/* Course Session Link */}
            {session.course_session && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Linked Course Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <Link
                      href={`/dashboard/sessions/${session.course_session.id}`}
                      className="font-medium hover:underline"
                    >
                      {session.course_session.name}
                    </Link>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Course:</p>
                    <p className="font-medium">{session.course_session.offerings?.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  <strong>Capacity changes:</strong> You can only decrease capacity if no students will lose their spot.
                </p>
                <p className="text-muted-foreground">
                  <strong>Status changes:</strong> Changing to "completed" will allow result entry for registered students.
                </p>
                <p className="text-muted-foreground">
                  <strong>Date changes:</strong> Students will need to be notified of date/time changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/exams/sessions/${session.id}`}>Cancel</Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs"
              disabled={saving}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete Session
            </Button>
          </div>
          <Button type="submit" disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}