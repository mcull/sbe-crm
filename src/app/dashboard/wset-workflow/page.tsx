import { Suspense } from 'react'
import { getWorkflowDashboardData } from '@/lib/wset-workflow/dashboard-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Users,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import WorkflowStatesList from '@/components/wset-workflow/WorkflowStatesList'
import WSETDeadlineTracker from '@/components/wset-workflow/WSETDeadlineTracker'
import RecentActivityFeed from '@/components/wset-workflow/RecentActivityFeed'

export default async function WSETWorkflowPage() {
  const dashboardData = await getWorkflowDashboardData()

  const statusCounts = dashboardData.workflowStates.reduce((acc, state) => {
    acc[state.status] = (acc[state.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const urgentCount = dashboardData.deadlineValidations.filter(
    v => v.workingDaysRemaining <= 2 && v.errors.length === 0
  ).length

  const overdueCount = dashboardData.deadlineValidations.filter(
    v => v.errors.length > 0
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WSET Workflow Automation</h1>
          <p className="text-muted-foreground">
            Monitor and manage Squarespace to WSET exam submission workflows
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/wset-workflow/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/wset-workflow/manual-submit">
              <FileText className="mr-2 h-4 w-4" />
              Manual Submit
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.workflowStates.filter(s =>
                !['completed', 'error'].includes(s.status)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.processing || 0} processing, {statusCounts.submitted || 0} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">
              ≤2 working days remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Past WSET deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Interface */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">
            <Users className="mr-2 h-4 w-4" />
            Active Workflows
          </TabsTrigger>
          <TabsTrigger value="deadlines">
            <Clock className="mr-2 h-4 w-4" />
            Deadline Tracker
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Mail className="mr-2 h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workflow States</CardTitle>
                <div className="flex space-x-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <Badge key={status} variant="outline">
                      {status}: {String(count)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading workflows...</div>}>
                <WorkflowStatesList
                  workflowStates={dashboardData.workflowStates}
                  deadlineValidations={dashboardData.deadlineValidations}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                WSET Submission Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading deadline tracker...</div>}>
                <WSETDeadlineTracker
                  validations={dashboardData.deadlineValidations}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Recent Workflow Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading activity feed...</div>}>
                <RecentActivityFeed
                  activities={dashboardData.recentActivity}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/wset-workflow/test-webhook">
                <FileText className="mr-2 h-4 w-4" />
                Test Squarespace Webhook
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/wset-workflow/manual-forms">
                <Users className="mr-2 h-4 w-4" />
                Generate Forms Manually
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/wset-workflow/email-templates">
                <Mail className="mr-2 h-4 w-4" />
                Manage Email Templates
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Webhook Endpoint</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Pending Setup
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PDF Generation</span>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Pending Setup
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}