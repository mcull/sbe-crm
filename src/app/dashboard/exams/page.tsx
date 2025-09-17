import { Suspense } from 'react'
import { getExams } from '@/lib/actions/exams'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Users, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import ExamsTable from '@/components/exams/ExamsTable'

export default async function ExamsPage() {
  const exams = await getExams()

  // Group exams by status for dashboard stats
  const upcomingExams = exams.filter(exam => new Date(exam.exam_date) > new Date())
  const completedExams = exams.filter(exam => new Date(exam.exam_date) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground">
            Schedule and manage WSET certification exams
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Exam
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
            <p className="text-xs text-muted-foreground">
              Next: {upcomingExams.length > 0
                ? new Date(Math.min(...upcomingExams.map(e => new Date(e.exam_date).getTime()))).toLocaleDateString()
                : 'None scheduled'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingExams.reduce((sum, exam) => sum + exam.max_candidates, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingExams.reduce((sum, exam) => sum + (exam.current_registrations || 0), 0)} registered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExams.length}</div>
            <p className="text-xs text-muted-foreground">
              This year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading exams...</div>}>
            <ExamsTable exams={exams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}