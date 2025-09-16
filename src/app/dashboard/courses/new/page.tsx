import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CourseForm from '@/components/courses/CourseForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewCoursePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Create Course Template</h1>
          <p className="text-muted-foreground">
            Define a new WSET course template for scheduling sessions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm />
        </CardContent>
      </Card>
    </div>
  )
}