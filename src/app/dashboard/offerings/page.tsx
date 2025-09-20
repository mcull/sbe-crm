import { Suspense } from 'react'
import { getOfferings, getSessions, getOfferingsStats } from '@/lib/actions/offerings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GraduationCap,
  ClipboardCheck,
  Wine,
  Package,
  Plus,
  Eye,
  Edit,
  Calendar,
  Users,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'wset_course': return <GraduationCap className="h-4 w-4" />
    case 'standalone_exam': return <ClipboardCheck className="h-4 w-4" />
    case 'tasting': return <Wine className="h-4 w-4" />
    case 'product': return <Package className="h-4 w-4" />
    default: return <Package className="h-4 w-4" />
  }
}

function getTypeBadge(type: string) {
  const variants = {
    wset_course: { variant: 'default' as const, text: 'WSET Course' },
    standalone_exam: { variant: 'secondary' as const, text: 'Exam' },
    tasting: { variant: 'outline' as const, text: 'Tasting' },
    product: { variant: 'outline' as const, text: 'Product' }
  }
  const config = variants[type as keyof typeof variants] || variants.product
  return <Badge variant={config.variant}>{config.text}</Badge>
}

async function OfferingsStats() {
  const stats = await getOfferingsStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOfferings}</div>
          <p className="text-xs text-muted-foreground">
            Active course catalog
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
          <p className="text-xs text-muted-foreground">
            Scheduled sessions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.availableSpots}</div>
          <p className="text-xs text-muted-foreground">
            Open spots across all sessions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalCapacity > 0 ? Math.round((stats.totalEnrollment / stats.totalCapacity) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalEnrollment} of {stats.totalCapacity} seats
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function WSETCoursesTab() {
  const offerings = await getOfferings('wset_course')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WSET Courses</h3>
          <p className="text-sm text-muted-foreground">
            Core WSET certification courses with automatic product generation
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/offerings/course/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offerings.map((offering) => (
          <Card key={offering.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  WSET Level {offering.wset_level}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/offerings/${offering.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/offerings/${offering.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <CardTitle className="text-base line-clamp-2">
                {offering.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground line-clamp-2">
                {offering.description}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <div className="font-medium">{formatCurrency(offering.base_price)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{offering.default_duration_hours}h</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Capacity:</span>
                  <div className="font-medium">{offering.default_capacity}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={offering.active ? 'default' : 'secondary'} className="text-xs">
                    {offering.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {offerings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No WSET courses found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first WSET course offering to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/offerings/course/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function ExamsTab() {
  const offerings = await getOfferings('standalone_exam')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Standalone Exams</h3>
          <p className="text-sm text-muted-foreground">
            Individual exams for retakes, transfers, and direct certification
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/offerings/exam/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Exam
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {offerings.map((offering) => (
          <Card key={offering.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  Level {offering.wset_level}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/offerings/${offering.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardTitle className="text-base line-clamp-2">
                {offering.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground capitalize">
                {offering.exam_type} • {offering.default_duration_hours}h
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">{formatCurrency(offering.base_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">{offering.default_capacity}</span>
              </div>
              <div className="pt-2">
                <Badge variant={offering.active ? 'default' : 'secondary'} className="text-xs">
                  {offering.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {offerings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exam offerings found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create standalone exam offerings for retakes and direct certification.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function TastingsTab() {
  const offerings = await getOfferings('tasting')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wine Tastings</h3>
          <p className="text-sm text-muted-foreground">
            Casual wine tasting events and educational experiences
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/offerings/tasting/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tasting
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offerings.map((offering) => (
          <Card key={offering.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {getTypeBadge(offering.type)}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/offerings/${offering.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardTitle className="text-base line-clamp-2">
                {offering.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground line-clamp-2">
                {offering.description}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">{formatCurrency(offering.base_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{offering.default_duration_hours}h</span>
              </div>
              <div className="pt-2">
                <Badge variant={offering.active ? 'default' : 'secondary'} className="text-xs">
                  {offering.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {offerings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wine className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasting offerings found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create wine tasting events and educational experiences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function SessionsTab() {
  const sessions = await getSessions()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Sessions</h3>
          <p className="text-sm text-muted-foreground">
            All upcoming sessions with enrollment and capacity tracking
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Session</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Enrollment</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session: any) => (
                  <tr key={session.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="max-w-[300px]">
                        <div className="font-medium truncate">{session.name || session.offerings?.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {getTypeIcon(session.offerings?.type)}
                          {getTypeBadge(session.offerings?.type)}
                          {session.offerings?.wset_level && (
                            <Badge variant="outline" className="text-xs">
                              Level {session.offerings.wset_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(session.session_date)}</span>
                      </div>
                      {session.end_date && session.end_date !== session.session_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Until {formatDate(session.end_date)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.location || 'Online'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize mt-1">
                        {session.delivery_method?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {session.current_enrollment || 0}/{session.max_capacity}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, ((session.current_enrollment || 0) / session.max_capacity) * 100)}%`
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <Badge
                          variant={session.booking_enabled ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {session.booking_enabled ? 'Open' : 'Closed'}
                        </Badge>
                        {session.available_spots <= 0 && session.booking_enabled && (
                          <Badge variant="destructive" className="text-xs block">
                            Full
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/sessions/${session.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/sessions/${session.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sessions scheduled yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OfferingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course & Session Management</h1>
          <p className="text-muted-foreground">
            Manage offerings, schedule sessions, and track enrollment with automatic product generation
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <OfferingsStats />
      </Suspense>

      <Tabs defaultValue="courses" className="space-y-4" id="offerings-tabs">
        <TabsList>
          <TabsTrigger value="courses">
            <GraduationCap className="mr-2 h-4 w-4" />
            WSET Courses
          </TabsTrigger>
          <TabsTrigger value="exams">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="tastings">
            <Wine className="mr-2 h-4 w-4" />
            Tastings
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="mr-2 h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Suspense fallback={<div className="text-center py-12">Loading WSET courses...</div>}>
            <WSETCoursesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="exams">
          <Suspense fallback={<div className="text-center py-12">Loading exam offerings...</div>}>
            <ExamsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="tastings">
          <Suspense fallback={<div className="text-center py-12">Loading tasting offerings...</div>}>
            <TastingsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="sessions">
          <Suspense fallback={<div className="text-center py-12">Loading sessions...</div>}>
            <SessionsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}