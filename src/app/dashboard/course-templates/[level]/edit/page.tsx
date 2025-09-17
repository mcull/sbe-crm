import { getCourseTemplate } from '@/lib/actions/course-templates'
import CourseTemplateForm from '@/components/course-templates/CourseTemplateForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    level: string
  }
}

export default async function EditCourseTemplatePage({ params }: PageProps) {
  const wsetLevel = parseInt(params.level)

  if (isNaN(wsetLevel) || wsetLevel < 1 || wsetLevel > 4) {
    notFound()
  }

  let template
  try {
    template = await getCourseTemplate(wsetLevel)
  } catch (error) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/course-templates">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Templates
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Course Template</h1>
          <Badge variant="outline">
            WSET Level {template.wset_level}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Modify the default values used when creating new WSET Level {template.wset_level} courses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseTemplateForm template={template} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Usage</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            When users create a new course and select &quot;WSET Level {template.wset_level}&quot;,
            the form will automatically populate with the values you configure here.
          </p>
          <p>
            Users can still modify any of these values when creating individual courses -
            this template only provides convenient defaults to speed up course creation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}