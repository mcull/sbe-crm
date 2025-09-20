'use client'

import { useState, useEffect, use } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Calendar, Users, MapPin, Clock, Settings, AlertCircle, CheckCircle, UserPlus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ExamSession, ExamRegistration } from "@/lib/types/exams"
import { getExamSession, getExamRegistrations } from "@/lib/actions/exams"

interface ExamSessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ExamSessionDetailPage({ params }: ExamSessionDetailPageProps) {
  const resolvedParams = use(params)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (resolvedParams.id) {
      loadSessionData(resolvedParams.id)
    }
  }, [resolvedParams.id])

  const loadSessionData = async (sessionId: string) => {
    try {
      setLoading(true)
      const [sessionData, registrationsData] = await Promise.all([
        getExamSession(sessionId),
        getExamRegistrations({ exam_session_id: sessionId })
      ])

      setSession(sessionData)
      setRegistrations(registrationsData)
    } catch (error) {
      console.error('Failed to load session data:', error)
      setError('Failed to load exam session')
    } finally {
      setLoading(false)
    }
  }

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

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'no_show': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Group registrations by status
  const registeredStudents = registrations.filter(r => r.status === 'registered')
  const confirmedStudents = registrations.filter(r => r.status === 'confirmed')
  const completedStudents = registrations.filter(r => r.status === 'completed')
  const noShowStudents = registrations.filter(r => r.status === 'no_show')

  // Calculate pass rate for completed registrations
  const passedStudents = completedStudents.filter(r => r.overall_passed)
  const passRate = completedStudents.length > 0 ? (passedStudents.length / completedStudents.length) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !session) {
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
            <p className="text-muted-foreground">
              {error || 'The requested exam session could not be found.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exams/sessions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">
                {session.name || session.exam_template?.name}
              </h1>
              <Badge className={getSessionTypeColor(session.session_type)}>
                {session.session_type.replace('_', ' ')}
              </Badge>
              <Badge className={getStatusColor(session.status)}>
                {session.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(session.exam_date), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{session.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{session.current_enrollment}/{session.max_capacity}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/exams/sessions/${session.id}/register`}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/exams/sessions/${session.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.current_enrollment}</div>
            <p className="text-xs text-muted-foreground">
              of {session.max_capacity} ({Math.round((session.current_enrollment / session.max_capacity) * 100)}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Spots</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.available_spots}</div>
            <p className="text-xs text-muted-foreground">remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.exam_template?.duration_minutes}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedStudents.length > 0 ? `${passRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {passedStudents.length} of {completedStudents.length} passed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">
            Registrations ({registrations.length})
          </TabsTrigger>
          {session.status === 'completed' && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Exam Template:</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/exams/templates/${session.exam_template?.id}`}
                      className="font-medium hover:underline"
                    >
                      {session.exam_template?.name}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {session.exam_template?.exam_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time:</p>
                  <p className="font-medium">{format(new Date(session.exam_date), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm">{format(new Date(session.exam_date), 'h:mm a')}</p>
                </div>
                {session.exam_end_time && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Time:</p>
                    <p className="font-medium">{format(new Date(session.exam_end_time), 'h:mm a')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Location:</p>
                  <p className="font-medium">{session.location || 'Not specified'}</p>
                </div>
                {session.proctor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Proctor:</p>
                    <p className="font-medium">{session.proctor}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Method:</p>
                  <p className="font-medium capitalize">{session.delivery_method.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Course Session Link */}
            {session.course_session && (
              <Card>
                <CardHeader>
                  <CardTitle>Linked Course Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Session:</p>
                    <Link
                      href={`/dashboard/sessions/${session.course_session.id}`}
                      className="font-medium hover:underline"
                    >
                      {session.course_session.name}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Course:</p>
                    <p className="font-medium">{session.course_session.offerings?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Session Date:</p>
                    <p className="font-medium">{format(new Date(session.course_session.session_date), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Booking Enabled:</span>
                  {session.booking_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                {session.registration_deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Deadline:</p>
                    <p className="font-medium">{format(new Date(session.registration_deadline), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created:</p>
                  <p className="font-medium">{format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Link */}
            {session.product && (
              <Card>
                <CardHeader>
                  <CardTitle>Associated Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name:</p>
                    <Link
                      href={`/dashboard/products/${session.product.id}`}
                      className="font-medium hover:underline"
                    >
                      {session.product.name}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price:</p>
                    <p className="font-medium">£{session.product.base_price}</p>
                  </div>
                  {session.product.stripe_product_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">Stripe Product:</p>
                      <p className="font-mono text-xs">{session.product.stripe_product_id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Student Registrations</h3>
              <p className="text-muted-foreground">
                {registrations.length} student{registrations.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard/exams/sessions/${session.id}/register`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Link>
            </Button>
          </div>

          {/* Registration Status Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registeredStudents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedStudents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedStudents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">No Show</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{noShowStudents.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Registrations List */}
          <Card>
            <CardContent className="p-6">
              {registrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Registrations Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    No students have registered for this exam session.
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/exams/sessions/${session.id}/register`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add First Student
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {registration.candidate?.first_name} {registration.candidate?.last_name}
                          </h4>
                          <Badge className={getRegistrationStatusColor(registration.status)} className="text-xs">
                            {registration.status}
                          </Badge>
                          {registration.is_makeup && (
                            <Badge variant="outline" className="text-xs">Makeup</Badge>
                          )}
                          {registration.is_resit && (
                            <Badge variant="outline" className="text-xs">Resit</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{registration.candidate?.email}</span>
                          <span>• Attempt #{registration.attempt_number}</span>
                          {registration.fee_amount > 0 && (
                            <span>• £{registration.fee_amount} {registration.fee_paid ? '(Paid)' : '(Unpaid)'}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {registration.status === 'completed' && registration.overall_passed !== null && (
                          <Badge variant={registration.overall_passed ? 'default' : 'destructive'} className="text-xs">
                            {registration.overall_passed ? 'Pass' : 'Fail'}
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/candidates/${registration.candidate?.id}`}>
                            View Student
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {session.status === 'completed' && (
          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Exam Results</h3>
                <p className="text-muted-foreground">
                  Results for {completedStudents.length} student{completedStudents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="outline">
                Export Results
              </Button>
            </div>

            {/* Results Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {passedStudents.length} of {completedStudents.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {completedStudents.length > 0
                      ? (completedStudents.reduce((sum, r) => sum + (r.overall_score || 0), 0) / completedStudents.length).toFixed(1)
                      : 'N/A'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    out of {session.exam_template?.max_score || 100}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pass Mark</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{session.exam_template?.pass_mark_percentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(((session.exam_template?.max_score || 100) * (session.exam_template?.pass_mark_percentage || 55)) / 100)} points
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Individual Results */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Results</CardTitle>
              </CardHeader>
              <CardContent>
                {completedStudents.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No results available yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {completedStudents.map((registration) => (
                      <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {registration.candidate?.first_name} {registration.candidate?.last_name}
                            </h4>
                            <Badge variant={registration.overall_passed ? 'default' : 'destructive'} className="text-xs">
                              {registration.overall_passed ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {registration.theory_score !== null && (
                              <span>Theory: {registration.theory_score}% {registration.theory_passed ? '✓' : '✗'}</span>
                            )}
                            {registration.tasting_score !== null && (
                              <span>Tasting: {registration.tasting_score}% {registration.tasting_passed ? '✓' : '✗'}</span>
                            )}
                            {registration.overall_score !== null && (
                              <span>Overall: {registration.overall_score}%</span>
                            )}
                          </div>
                          {registration.result_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Notes: {registration.result_notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          {registration.result_date && (
                            <p className="text-muted-foreground">
                              {format(new Date(registration.result_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}