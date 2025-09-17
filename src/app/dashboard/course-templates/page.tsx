import { getCourseTemplates } from '@/lib/actions/course-templates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function CourseTemplatesPage() {
  const templates = await getCourseTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Templates</h1>
          <p className="text-muted-foreground">
            Manage WSET course templates used when creating new courses
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  WSET Level {template.wset_level}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/course-templates/${template.wset_level}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground line-clamp-3">
                {template.description}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span>{template.duration_weeks} weeks</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capacity:</span>
                <span>{template.max_capacity} students</span>
              </div>
              {template.price && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span>${template.price}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No course templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Course templates will be automatically created when you run the database migration.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Course Templates</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Course templates provide default values when creating new courses for each WSET level.
            When a user selects a WSET level in the course creation form, the corresponding template
            values will automatically populate the form fields.
          </p>
          <ul>
            <li><strong>Name:</strong> Default course name for this WSET level</li>
            <li><strong>Description:</strong> Standard course description and learning objectives</li>
            <li><strong>Duration:</strong> Typical course length in weeks</li>
            <li><strong>Capacity:</strong> Maximum number of students per session</li>
            <li><strong>Price:</strong> Default pricing (optional)</li>
          </ul>
          <p>
            These templates can be customized to match your organization&apos;s specific offerings
            while maintaining WSET compliance standards.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}