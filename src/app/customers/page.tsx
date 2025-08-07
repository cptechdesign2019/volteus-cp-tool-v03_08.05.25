import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { CustomerDashboard } from '@/components/customers/customer-dashboard'

export default async function CustomersPage() {
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
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    tenant_id: null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        userRole={profile?.role || 'technician'} 
        userEmail={user.email || undefined}
      />
      
      {/* Main content area */}
      <div className="flex-1 ml-64 transition-all duration-300">
        <main className="p-8 customers-page">
          <div className="max-w-7xl mx-auto space-y-8">
            <Suspense fallback={
              <div className="space-y-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-primary-800">Customers</h1>
                  <p className="text-primary-600 mt-2">Manage customer relationships and information</p>
                </div>
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-primary-100 h-24 rounded-lg loading-skeleton"></div>
                    ))}
                  </div>
                </div>
              </div>
            }>
              <CustomerDashboard />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}