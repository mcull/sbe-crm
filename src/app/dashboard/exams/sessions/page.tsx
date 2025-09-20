'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Calendar, MapPin, Users, Clock, Edit, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ExamSession } from "@/lib/types/exams"
import { getExamSessions } from "@/lib/actions/exams"

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchTerm, sessionTypeFilter, statusFilter, timeFilter])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await getExamSessions()
      setSessions(data)
    } catch (error) {
      console.error('Failed to load exam sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSessions = () => {
    let filtered = [...sessions]

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.exam_template?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(session => session.session_type === sessionTypeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    const now = new Date()
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(session => new Date(session.exam_date) >= now)
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(session => new Date(session.exam_date) < now)
    }

    // Sort by date
    filtered.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())

    setFilteredSessions(filtered)
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

  const getCapacityColor = (session: ExamSession) => {
    const utilizationRate = session.current_enrollment / session.max_capacity
    if (utilizationRate >= 1) return 'text-red-600'
    if (utilizationRate >= 0.8) return 'text-yellow-600'
    return 'text-green-600'
  }

  const upcomingSessions = sessions.filter(s => new Date(s.exam_date) >= new Date() && s.status === 'scheduled')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exam Sessions</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
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
          <h1 className="text-3xl font-bold">Exam Sessions</h1>
          <p className="text-muted-foreground">
            Manage scheduled exam sessions across all courses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exams/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.current_enrollment, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Sessions</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="p-3">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Session Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bundled">Bundled</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                  <SelectItem value="resit">Resit</SelectItem>
                  <SelectItem value="remote_invigilation">Remote</SelectItem>
                  <SelectItem value="standalone">Standalone</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {session.name || session.exam_template?.name}
                      </h3>
                      <Badge className={getSessionTypeColor(session.session_type)}>
                        {session.session_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(session.exam_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(session.exam_date), 'h:mm a')}
                          </p>
                        </div>
                      </div>

                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Location</p>
                            <p className="text-muted-foreground">{session.location}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Capacity</p>
                          <p className={getCapacityColor(session)}>
                            {session.current_enrollment}/{session.max_capacity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Duration</p>
                          <p className="text-muted-foreground">
                            {session.exam_template?.duration_minutes} min
                          </p>
                        </div>
                      </div>
                    </div>

                    {session.course_session && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Bundled with course session:</p>
                        <p className="font-medium">{session.course_session.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/exams/sessions/${session.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/exams/sessions/${session.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {filteredSessions
            .filter(s => new Date(s.exam_date) >= new Date())
            .map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Same content structure as "all" tab */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {session.name || session.exam_template?.name}
                        </h3>
                        <Badge className={getSessionTypeColor(session.session_type)}>
                          {session.session_type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(session.exam_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-muted-foreground">
                              {format(new Date(session.exam_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        {session.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p className="text-muted-foreground">{session.location}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Capacity</p>
                            <p className={getCapacityColor(session)}>
                              {session.current_enrollment}/{session.max_capacity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Duration</p>
                            <p className="text-muted-foreground">
                              {session.exam_template?.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/exams/sessions/${session.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/exams/sessions/${session.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredSessions
            .filter(s => s.status === 'completed')
            .map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Same content structure */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {session.name || session.exam_template?.name}
                        </h3>
                        <Badge className={getSessionTypeColor(session.session_type)}>
                          {session.session_type.replace('_', ' ')}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Completed on {format(new Date(session.exam_date), 'MMM d, yyyy')}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/exams/sessions/${session.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Results
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {filteredSessions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No exam sessions found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || sessionTypeFilter !== 'all' || statusFilter !== 'all'
                    ? "Try adjusting your search or filters"
                    : "Create your first exam session to get started"
                  }
                </p>
              </div>
              {(!searchTerm && sessionTypeFilter === 'all' && statusFilter === 'all') && (
                <Button asChild>
                  <Link href="/dashboard/exams/sessions/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Session
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}