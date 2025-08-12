import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { LeadsDashboard } from '@/components/leads/leads-dashboard'

export default async function LeadsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // For now, we'll use a default profile since we haven't migrated user_profiles yet
  const profile = {
    role: 'admin',
    email: user.email || 'user@example.com'
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        userRole={profile.role} 
        userEmail={profile.email}
      />
      
      {/* Main content area with sidebar offset */}
      <div className="flex-1 ml-64 transition-all duration-300">
        <main className="p-8">
          <Suspense fallback={<div>Loading leads...</div>}>
            <LeadsDashboard />
          </Suspense>
        </main>
      </div>
    </div>
  )
}