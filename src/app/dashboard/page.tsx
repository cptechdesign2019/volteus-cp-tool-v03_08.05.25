import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardPage() {
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
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#162944' }}>
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your business today.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F4B400' }}>
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Quotes</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#4CAF50' }}>
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">48</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#2196F3' }}>
                    <span className="text-white text-xl">🔧</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">7</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#FF9800' }}>
                    <span className="text-white text-xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">$24.5K</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/quotes" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quotes</h3>
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-600 mb-4">Create and manage customer quotes</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View all quotes →
                  </div>
                </div>
              </Link>

              <Link href="/customers" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-gray-600 mb-4">Manage customer relationships</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View all customers →
                  </div>
                </div>
              </Link>

              <Link href="/product-library" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Product Library</h3>
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-gray-600 mb-4">Browse AV equipment catalog</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View products →
                  </div>
                </div>
              </Link>

              <Link href="/projects" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                    <span className="text-2xl">🔧</span>
                  </div>
                  <p className="text-gray-600 mb-4">Track project progress</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View projects →
                  </div>
                </div>
              </Link>

              <Link href="/leads" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Leads</h3>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-gray-600 mb-4">Manage potential customers</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View leads →
                  </div>
                </div>
              </Link>

              <Link href="/reporting" className="group">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Reporting</h3>
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-gray-600 mb-4">View business analytics</p>
                  <div className="text-sm text-blue-600 group-hover:text-blue-700">
                    View reports →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}