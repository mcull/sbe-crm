import { getCourses, getCourseSession } from '@/lib/actions/courses'
import SessionForm from '@/components/courses/SessionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params
  let session
  let courses

  try {
    [session, courses] = await Promise.all([
      getCourseSession(id),
      getCourses()
    ])
  } catch (error) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Course Session</h1>
          <Badge className={getStatusColor(session.status)}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Modify the session details, dates, and settings
        </p>
      </div>

      {/* Session Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Session Overview</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Course</p>
              <p className="font-medium">{session.courses?.name}</p>
              <p className="text-xs text-muted-foreground">WSET Level {session.courses?.wset_level}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Dates</p>
              <p className="font-medium">
                {new Date(session.start_date).toLocaleDateString()} -{' '}
                {new Date(session.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Enrollment</p>
              <p className="font-medium">
                {session.current_enrollment || 0} / {session.courses?.max_capacity || 0} students
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionForm courses={courses} session={session} />
        </CardContent>
      </Card>
    </div>
  )
}