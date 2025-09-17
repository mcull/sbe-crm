import { getExam } from '@/lib/actions/exams'
import { getCourses } from '@/lib/actions/courses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ExamForm from '@/components/exams/ExamForm'
import { notFound } from 'next/navigation'

interface EditExamPageProps {
  params: { id: string }
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  try {
    const [exam, courses] = await Promise.all([
      getExam(params.id),
      getCourses()
    ])

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Exam</h1>
            <p className="text-muted-foreground">
              Modify exam details for {exam.courses?.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ExamForm exam={exam} courses={courses} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    notFound()
  }
}