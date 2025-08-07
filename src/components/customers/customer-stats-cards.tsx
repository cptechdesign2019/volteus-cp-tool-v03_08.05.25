'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Building, Home, UserPlus, UserCheck, TrendingUp } from 'lucide-react'

interface CustomerStats {
  total_customers: number
  residential_count: number
  commercial_count: number
  recent_additions: number
  with_multiple_contacts: number
}

interface CustomerStatsCardsProps {
  stats?: CustomerStats | null
  isLoading?: boolean
  error?: string | null
}

export function CustomerStatsCards({ 
  stats, 
  isLoading = false, 
  error = null 
}: CustomerStatsCardsProps) {
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading customer statistics: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0'
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const calculateResidentialPercentage = () => {
    if (!stats || stats.total_customers === 0 || !stats.residential_count) return 0
    return Math.round((stats.residential_count / stats.total_customers) * 100)
  }

  const calculateCommercialPercentage = () => {
    if (!stats || stats.total_customers === 0 || !stats.commercial_count) return 0
    return Math.round((stats.commercial_count / stats.total_customers) * 100)
  }

  const calculateMultiContactPercentage = () => {
    if (!stats || stats.total_customers === 0 || !stats.with_multiple_contacts) return 0
    return Math.round((stats.with_multiple_contacts / stats.total_customers) * 100)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Total Customers */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Total Customers</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {formatNumber(stats.total_customers)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Residential Customers */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Residential</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {formatNumber(stats.residential_count)}
              </p>
              <p className="text-xs text-primary-500">
                {calculateResidentialPercentage()}% of total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Home className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commercial Customers */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Commercial</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {formatNumber(stats.commercial_count)}
              </p>
              <p className="text-xs text-primary-500">
                {calculateCommercialPercentage()}% of total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Additions */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-orange-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Recent (30 days)</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {formatNumber(stats.recent_additions)}
              </p>
              <p className="text-xs text-primary-500">
                New customers
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Contacts */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Multi-Contact</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {formatNumber(stats.with_multiple_contacts)}
              </p>
              <p className="text-xs text-primary-500">
                {calculateMultiContactPercentage()}% of total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Rate (calculated) */}
      <Card className="hover:shadow-lg transition-all duration-300 border-primary-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Growth Rate</p>
              <p className="text-3xl font-bold text-primary-800 font-montserrat">
                {stats.total_customers > 0 ? 
                  `${Math.round((stats.recent_additions / Math.max(stats.total_customers - stats.recent_additions, 1)) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-xs text-primary-500">
                Monthly growth
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}