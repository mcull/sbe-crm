import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get basic stats for the dashboard
  const [
    { count: candidateCount },
    { count: courseCount },
    { count: sessionCount },
    { count: examCount },
  ] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('course_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
  ])

  // Get recent activity (upcoming sessions)
  const { data: upcomingSessions } = await supabase
    .from('course_sessions')
    .select(`
      *,
      courses (name, wset_level)
    `)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the SBE CRM. Here&apos;s an overview of your wine education business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidateCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courseCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 bg-purple-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Course Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessionCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-600 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled Exams</p>
              <p className="text-2xl font-bold text-gray-900">{examCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Course Sessions</h2>
        </div>
        <div className="p-6">
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {session.courses?.name} (Level {session.courses?.wset_level})
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Instructor: {session.instructor || 'TBD'} • Location: {session.location || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {session.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.current_enrollment || 0} enrolled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No upcoming sessions scheduled. Create your first course session to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}