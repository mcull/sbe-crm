import { Suspense } from 'react'
import { getCourses, getCourseSessions } from '@/lib/actions/courses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import CoursesTable from '@/components/courses/CoursesTable'
import SessionsTable from '@/components/courses/SessionsTable'

export default async function CoursesPage() {
  const [courses, sessions] = await Promise.all([
    getCourses(),
    getCourseSessions(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses & Sessions</h1>
          <p className="text-muted-foreground">
            Manage WSET courses and scheduled sessions
          </p>
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Sessions ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">WSET Courses</h2>
            <Button asChild>
              <Link href="/dashboard/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading courses...</div>}>
                <CoursesTable courses={courses} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Scheduled Course Sessions</h2>
            <Button asChild>
              <Link href="/dashboard/courses/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading sessions...</div>}>
                <SessionsTable sessions={sessions} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}