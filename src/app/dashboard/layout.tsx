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
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} userProfile={userProfile} />
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              <a
                href="/dashboard"
                className="flex items-center px-2 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-100"
              >
                Dashboard
              </a>
              <a
                href="/dashboard/candidates"
                className="flex items-center px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-100"
              >
                Candidates
              </a>
              <a
                href="/dashboard/courses"
                className="flex items-center px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-100"
              >
                Courses
              </a>
              <a
                href="/dashboard/exams"
                className="flex items-center px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-100"
              >
                Exams
              </a>
              <a
                href="/dashboard/reports"
                className="flex items-center px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-100"
              >
                Reports
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