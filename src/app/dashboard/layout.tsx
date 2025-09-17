import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile from our users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} userProfile={userProfile} />
      <div className="flex">
        <aside className="w-64 bg-background border-r border-border">
          <nav className="mt-8">
            <div className="px-4 space-y-1">
              <a
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/dashboard/candidates"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Candidates
              </a>
              <a
                href="/dashboard/courses"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Courses
              </a>
              <a
                href="/dashboard/orders"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Orders
              </a>
              <a
                href="/dashboard/products"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Products
              </a>
              <a
                href="/dashboard/course-templates"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Course Templates
              </a>
              <a
                href="/dashboard/exams"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Exams
              </a>
              <a
                href="/dashboard/wset-workflow"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                WSET Workflow
              </a>
              <a
                href="/dashboard/reports"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Reports
              </a>
              <a
                href="/dashboard/components"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Components
              </a>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}