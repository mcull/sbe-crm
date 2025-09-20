'use client'

import { useState, useEffect, use } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Calendar, Users, BookOpen, Settings, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ExamTemplate, ExamSession } from "@/lib/types/exams"
import { getExamTemplate, getExamSessions } from "@/lib/actions/exams"

interface ExamTemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ExamTemplateDetailPage({ params }: ExamTemplateDetailPageProps) {
  const resolvedParams = use(params)
  const [template, setTemplate] = useState<ExamTemplate | null>(null)
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (resolvedParams.id) {
      loadTemplateData(resolvedParams.id)
    }
  }, [resolvedParams.id])

  const loadTemplateData = async (templateId: string) => {
    try {
      setLoading(true)
      const [templateData, sessionsData] = await Promise.all([
        getExamTemplate(templateId),
        getExamSessions({ exam_template_id: templateId })
      ])

      setTemplate(templateData)
      setSessions(sessionsData)
    } catch (error) {
      console.error('Failed to load template data:', error)
      setError('Failed to load exam template')
    } finally {
      setLoading(false)
    }
  }

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-blue-100 text-blue-800'
      case 'tasting': return 'bg-purple-100 text-purple-800'
      case 'combined': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const upcomingSessions = sessions.filter(s => new Date(s.exam_date) >= new Date())
  const pastSessions = sessions.filter(s => new Date(s.exam_date) < new Date())

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
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
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

  if (error || !template) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exams/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Not Found</h1>
            <p className="text-muted-foreground">
              {error || 'The requested exam template could not be found.'}
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
            <Link href="/dashboard/exams/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{template.name}</h1>
              <Badge className={getExamTypeColor(template.exam_type)}>
                {template.exam_type}
              </Badge>
              {!template.active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {template.course_offering?.name}
              {template.course_offering?.wset_level && (
                <span> • Level {template.course_offering.wset_level}</span>
              )}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/exams/templates/${template.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingSessions.length} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.current_enrollment, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              across all sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template.duration_minutes}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Mark</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template.pass_mark_percentage}%</div>
            <p className="text-xs text-muted-foreground">
              of {template.max_score} points
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Course Name:</p>
                  <p className="font-medium">{template.course_offering?.name}</p>
                </div>
                {template.course_offering?.wset_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">WSET Level:</p>
                    <p className="font-medium">Level {template.course_offering.wset_level}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Course Type:</p>
                  <p className="font-medium capitalize">{template.course_offering?.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created:</p>
                  <p className="font-medium">{format(new Date(template.created_at), 'MMM d, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Exam Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Exam Type:</p>
                  <Badge className={getExamTypeColor(template.exam_type)}>
                    {template.exam_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration:</p>
                  <p className="font-medium">{template.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pass Mark:</p>
                  <p className="font-medium">{template.pass_mark_percentage}% ({Math.round(template.max_score * template.pass_mark_percentage / 100)} / {template.max_score} points)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status:</p>
                  <div className="flex items-center gap-2">
                    {template.active ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Bundling & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Bundled with Course:</p>
                  <div className="flex items-center gap-2">
                    {template.is_bundled_with_course ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Yes ({template.bundled_timing?.replace('_', ' ')})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span>No</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Independent Scheduling:</p>
                  <div className="flex items-center gap-2">
                    {template.can_schedule_independently ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Allowed ({template.scheduling_window_days} days)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span>Not allowed</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Service Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Makeup Fee:</p>
                    <p className="font-medium">£{template.makeup_fee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resit Fee:</p>
                    <p className="font-medium">£{template.resit_fee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remote Invigilation:</p>
                    <p className="font-medium">£{template.remote_invigilation_fee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enquiry Fee:</p>
                    <p className="font-medium">£{template.enquiry_fee}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resits Allowed:</span>
                    {template.allows_resits ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Enquiries Allowed:</span>
                    {template.allows_enquiries ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Exam Sessions</h3>
              <p className="text-muted-foreground">
                All scheduled sessions using this template
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard/exams/sessions/new?template=${template.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
          </div>

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions ({upcomingSessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {session.name || session.exam_template?.name}
                          </h4>
                          <Badge className={getSessionTypeColor(session.session_type)} className="text-xs">
                            {session.session_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{format(new Date(session.exam_date), 'MMM d, yyyy h:mm a')}</span>
                          {session.location && <span>• {session.location}</span>}
                          <span>• {session.current_enrollment}/{session.max_capacity} enrolled</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/exams/sessions/${session.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Sessions ({pastSessions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {session.name || session.exam_template?.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{format(new Date(session.exam_date), 'MMM d, yyyy')}</span>
                          <span>• {session.current_enrollment} students</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/exams/sessions/${session.id}`}>
                          View Results
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {pastSessions.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {pastSessions.length - 5} more sessions...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {sessions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Sessions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  This template hasn't been used to create any exam sessions yet.
                </p>
                <Button asChild>
                  <Link href={`/dashboard/exams/sessions/new?template=${template.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule First Session
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Advanced configuration for this exam template
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Template Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.active ? 'Active templates can be used to create new sessions' : 'Inactive templates cannot be used for new sessions'}
                    </p>
                  </div>
                  <Badge variant={template.active ? 'default' : 'secondary'}>
                    {template.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Actions</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/exams/templates/${template.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Template
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/exams/sessions/new?template=${template.id}`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Session
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}