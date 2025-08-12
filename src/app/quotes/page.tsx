import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { QuotesDashboard } from '@/components/quotes/quotes-dashboard'

export default async function QuotesPage() {
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={profile.role} userEmail={profile.email} />
      
      {/* Main content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8 quotes-page">
          <div className="max-w-7xl mx-auto space-y-8">
            <Suspense fallback={<div>Loading Quotes...</div>}>
              <QuotesDashboard />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
