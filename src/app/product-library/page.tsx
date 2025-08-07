'use client'

import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductDashboard } from '@/components/product-library/product-dashboard'

export default function ProductLibraryPage() {
  const supabase = createClient()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8 product-library-page">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="bg-white p-6 rounded-lg border border-primary-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-primary-800 font-montserrat">
                    Product Library
                  </h1>
                  <p className="text-primary-600 mt-2">
                    Manage your complete catalog of products and services
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <span className="text-sm font-medium text-green-600">Ready to Import</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Library Dashboard Component */}
            <Suspense fallback={<ProductLibraryPageSkeleton />}>
              <ProductDashboard />
            </Suspense>

          </div>
        </div>
      </main>
    </div>
  )
}

// Loading skeleton for the product library
function ProductLibraryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filter skeleton */}
      <div className="bg-white p-6 rounded-lg border border-primary-200">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-12 flex-1 bg-primary-100" />
          <Skeleton className="h-12 w-48 bg-primary-100" />
          <Skeleton className="h-12 w-32 bg-primary-100" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 bg-primary-100" />
          <Skeleton className="h-6 w-24 bg-primary-100" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white p-6 rounded-lg border border-primary-200">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 bg-primary-100" />
              <Skeleton className="h-12 flex-1 bg-primary-100" />
              <Skeleton className="h-12 w-24 bg-primary-100" />
              <Skeleton className="h-12 w-32 bg-primary-100" />
              <Skeleton className="h-12 w-20 bg-primary-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}