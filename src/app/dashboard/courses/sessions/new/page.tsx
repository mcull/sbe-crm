import { getCourses } from '@/lib/actions/courses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SessionForm from '@/components/courses/SessionForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewSessionPage() {
  const courses = await getCourses()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Course Session</h1>
          <p className="text-muted-foreground">
            Create a new scheduled session for a WSET course
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionForm courses={courses} />
        </CardContent>
      </Card>
    </div>
  )
}