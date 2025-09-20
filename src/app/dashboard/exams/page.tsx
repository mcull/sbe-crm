'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, BookOpen, AlertTriangle, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ExamSession, ExamTemplate, ExamRegistration } from "@/lib/types/exams"
import { getExamSessions, getExamTemplates, getExamRegistrations } from "@/lib/actions/exams"

export default function ExamsDashboard() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [templates, setTemplates] = useState<ExamTemplate[]>([])
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [sessionsData, templatesData, registrationsData] = await Promise.all([
        getExamSessions({ limit: 100 }),
        getExamTemplates({ limit: 50 }),
        getExamRegistrations({ limit: 100 })
      ])

      setSessions(sessionsData)
      setTemplates(templatesData)
      setRegistrations(registrationsData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const now = new Date()
  const upcomingSessions = sessions.filter(s =>
    new Date(s.exam_date) >= now && s.status === 'scheduled'
  )
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.exam_date)
    return sessionDate.toDateString() === now.toDateString()
  })
  const completedRegistrations = registrations.filter(r => r.status === 'completed')
  const pendingRegistrations = registrations.filter(r => r.status === 'registered')

  // Calculate pass rate
  const passedRegistrations = completedRegistrations.filter(r => r.overall_passed)
  const passRate = completedRegistrations.length > 0
    ? (passedRegistrations.length / completedRegistrations.length) * 100
    : 0

  // Get sessions needing attention (low capacity or upcoming)
  const sessionsNeedingAttention = upcomingSessions.filter(s => {
    const daysDiff = Math.ceil((new Date(s.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const lowCapacity = s.current_enrollment < s.max_capacity * 0.3
    const soonButNotFull = daysDiff <= 7 && s.current_enrollment < s.max_capacity * 0.8
    return lowCapacity || soonButNotFull
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Comprehensive WSET exam system overview</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">
            Comprehensive WSET exam system overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/exams/templates">
              <BookOpen className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/exams/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Exam
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaySessions.length} today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              across {new Set(templates.map(t => t.course_offering?.wset_level)).size} levels
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
              {pendingRegistrations.length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {passedRegistrations.length} of {completedRegistrations.length} passed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No exams scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todaySessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {session.name || session.exam_template?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.exam_date), 'h:mm a')} • {session.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSessionTypeColor(session.session_type)} className="text-xs">
                        {session.session_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {session.current_enrollment}/{session.max_capacity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsNeedingAttention.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">All sessions looking good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionsNeedingAttention.slice(0, 5).map((session) => {
                  const daysDiff = Math.ceil((new Date(session.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const utilizationRate = session.current_enrollment / session.max_capacity

                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {session.name || session.exam_template?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.exam_date), 'MMM d, yyyy')} •
                          {utilizationRate < 0.3 ? ' Low enrollment' : ` ${daysDiff} days away`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-yellow-700">
                          {session.current_enrollment}/{session.max_capacity}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/exams/sessions/${session.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Sessions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/exams/sessions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {session.name || session.exam_template?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.exam_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSessionTypeColor(session.session_type)} className="text-xs">
                      {session.session_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {session.current_enrollment}/{session.max_capacity}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingSessions.length === 0 && (
                <p className="text-muted-foreground text-sm">No upcoming sessions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Template Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exam Templates</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/exams/templates">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Template stats by level */}
              {[1, 2, 3, 4].map(level => {
                const levelTemplates = templates.filter(t => t.course_offering?.wset_level === level)
                if (levelTemplates.length === 0) return null

                return (
                  <div key={level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Level {level}</p>
                      <p className="text-xs text-muted-foreground">
                        {levelTemplates.length} template{levelTemplates.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {levelTemplates.map(t => (
                        <Badge key={t.id} variant="outline" className="text-xs">
                          {t.exam_type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
              {templates.length === 0 && (
                <p className="text-muted-foreground text-sm">No templates created yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/dashboard/exams/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Session
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/dashboard/exams/templates/new">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/dashboard/exams/registrations">
                <Users className="mr-2 h-4 w-4" />
                Manage Registrations
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/dashboard/exams/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}