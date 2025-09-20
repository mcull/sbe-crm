import { getCourse } from '@/lib/actions/courses'
import CourseForm from '@/components/courses/CourseForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCoursePage({ params }: PageProps) {
  const { id } = await params
  let course
  try {
    course = await getCourse(id)
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
        <p className="text-muted-foreground">
          Modify the course details and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm course={course} />
        </CardContent>
      </Card>
    </div>
  )
}