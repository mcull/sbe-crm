'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

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
    <header className="bg-background border-b border-border">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">SBE CRM</h1>
            <p className="text-sm text-muted-foreground">
              Southeastern Beverage Education
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{displayName}</p>
                <Badge variant={userProfile?.role === 'owner' ? 'default' : 'secondary'}>
                  {userProfile?.role === 'owner' ? 'Owner' : 'Admin'}
                </Badge>
              </div>
            </div>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}