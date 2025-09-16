'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'owner' | 'admin'
}

interface DashboardNavProps {
  user: User
  userProfile: UserProfile | null
}

export default function DashboardNav({ user, userProfile }: DashboardNavProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`.trim() || user.email
    : user.email

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              SBE CRM
            </h1>
            <p className="text-sm text-gray-500">
              Southeastern Beverage Education
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">
                {userProfile?.role === 'owner' ? 'Owner' : 'Administrator'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}