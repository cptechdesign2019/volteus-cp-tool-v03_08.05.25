'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CustomerStatsCards } from './customer-stats-cards'
import { CustomerSearchBar } from './customer-search-bar'
import { CustomerTable } from './customer-table'
import { CustomerEmptyStates } from './customer-empty-states'
import { CustomerSidebar } from './customer-sidebar'
import { EditCustomerModal } from './edit-customer-modal'
import { AddCustomerModal } from './add-customer-modal'
import { DeleteCustomerModal } from './delete-customer-modal'
import { CustomerCsvImportModal } from './customer-csv-import-modal'
import { useRealTimeCustomerStats } from '@/hooks/useCustomerStats'
import { useCustomerSearch } from '@/hooks/useCustomerSearch'
import { deleteAllCustomers } from '@/lib/api/customers'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCcw, Clock, Wifi, WifiOff, TrendingUp, UserPlus, Upload, Trash2 } from 'lucide-react'

interface CustomerDashboardProps {
  onStatsUpdate?: (stats: any) => void
}

export function CustomerDashboard({ onStatsUpdate }: CustomerDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  
  const queryClient = useQueryClient()
  
  const {
    data: stats,
    isLoading,
    error,
    isError,
    isStale,
    isRefetching,
    lastUpdated,
    refetchStats
  } = useRealTimeCustomerStats()

  const {
    customers,
    totalCount,
    totalPages,
    currentPage,
    searchParams,
    hasSearched,
    hasActiveSearch,
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
    search,
    changePage,
    clearSearch,
    refetch: refetchSearch
  } = useCustomerSearch()

  // Notify parent component when stats update
  useEffect(() => {
    if (stats && onStatsUpdate) {
      onStatsUpdate(stats)
    }
  }, [stats, onStatsUpdate])

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer)
    setIsSidebarOpen(true)
    console.log('Customer clicked:', customer)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    // Don't clear selectedCustomer immediately to allow for smooth animation
    setTimeout(() => setSelectedCustomer(null), 300)
  }

  const handleEditCustomer = (customer: any) => {
    setCustomerToEdit(customer)
    setIsEditModalOpen(true)
    setIsSidebarOpen(false) // Close sidebar when opening edit modal
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setCustomerToEdit(null)
  }

  const handleEditSuccess = () => {
    // Refresh the customer search results
    if (hasSearched) {
      refetchSearch()
    }
    // Refresh stats
    refetchStats()
  }

  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
  }

  const handleAddSuccess = () => {
    // Refresh the customer search results
    if (hasSearched) {
      refetchSearch()
    }
    // Refresh stats
    refetchStats()
  }

  const handleDeleteCustomer = (customer: any) => {
    setCustomerToDelete(customer)
    setIsDeleteModalOpen(true)
    setIsSidebarOpen(false) // Close sidebar when opening delete modal
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setCustomerToDelete(null)
  }

  const handleDeleteSuccess = () => {
    // Refresh the customer search results
    if (hasSearched) {
      refetchSearch()
    }
    // Refresh stats
    refetchStats()
  }

  const handleCsvImportSuccess = () => {
    // Refresh the customer search results
    if (hasSearched) {
      refetchSearch()
    }
    // Refresh stats
    refetchStats()
  }

  const handleDeleteAllCustomers = async () => {
    if (!window.confirm(
      '⚠️ WARNING: This will permanently delete ALL customers and contacts!\n\n' +
      'This action cannot be undone. Are you absolutely sure?'
    )) {
      return
    }

    if (!window.confirm(
      'This is your FINAL warning!\n\n' +
      'All customer data will be permanently deleted. Continue?'
    )) {
      return
    }

    setIsDeletingAll(true)
    try {
      const result = await deleteAllCustomers()
      if (result.success) {
        // Clear React Query cache
        queryClient.clear()
        console.log('Cleared React Query cache')
        
        // Refresh everything
        refetchStats()
        if (hasSearched) {
          refetchSearch()
        }
        alert('✅ All customer data has been deleted successfully!')
      } else {
        const message = (result as any).error ?? 'Unknown error'
        alert(`❌ Failed to delete customers: ${message}`)
      }
    } catch (error) {
      console.error('Error deleting all customers:', error)
      alert('❌ An unexpected error occurred while deleting customers')
    } finally {
      setIsDeletingAll(false)
    }
  }

  const formatLastUpdated = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return `${seconds}s ago`
    }
  }

  const getConnectionStatus = () => {
    if (isError) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Connection Error'
      }
    }
    
    if (isStale) {
      return {
        icon: Clock,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Updating...'
      }
    }
    
    return {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Live'
    }
  }

  const connectionStatus = getConnectionStatus()
  const StatusIcon = connectionStatus.icon

  return (
    <div className="space-y-8 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-primary-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary-800 font-montserrat">
            Customer Overview
          </h2>
          <p className="text-primary-600 mt-2">
            Real-time statistics and insights about your customer base
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${connectionStatus.bgColor} ${connectionStatus.borderColor}`}>
            <StatusIcon className={`h-4 w-4 ${connectionStatus.color}`} />
            <span className={`text-sm font-medium ${connectionStatus.color}`}>
              {connectionStatus.label}
            </span>
          </div>
          
          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Updated {formatLastUpdated(lastUpdated)}
            </div>
          )}
          
          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Unable to load customer statistics. Please check your connection and try again.</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchStats()}
                  disabled={isRefetching}
                >
                  {isRefetching ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <CustomerStatsCards 
        stats={stats} 
        isLoading={isLoading}
        error={isError ? (error as Error)?.message : undefined}
      />

      {/* TEMPORARY: Delete All Customers Button */}
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <Trash2 className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">Development Tool - Remove Before Production</p>
              <p className="text-sm text-red-700">This button will permanently delete all customer data for testing purposes.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAllCustomers}
              disabled={isDeletingAll}
              className="ml-4 bg-red-600 hover:bg-red-700"
            >
              {isDeletingAll ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All Customers
                </div>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Dashboard Insights */}
      {stats && !isLoading && !isError && (
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary-800">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-primary-200">
              {/* Customer Mix */}
              <div className="space-y-4 pt-4 lg:pt-0 lg:pr-8">
                <h4 className="font-semibold text-primary-800 text-base">Customer Mix</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Residential</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                      {stats.total_customers > 0 ? 
                        Math.round((stats.residential_count / stats.total_customers) * 100) : 0
                      }%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Commercial</span>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-semibold">
                      {stats.total_customers > 0 ? 
                        Math.round((stats.commercial_count / stats.total_customers) * 100) : 0
                      }%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Growth Indicators */}
              <div className="space-y-4 pt-4 lg:pt-0 lg:px-8">
                <h4 className="font-semibold text-primary-800 text-base">Growth Indicators</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Recent Growth</span>
                    <Badge className={`font-semibold ${
                      stats.recent_additions > 0 
                        ? "bg-primary-100 text-primary-800 border-primary-200" 
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}>
                      {stats.recent_additions} new
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Multi-Contact Rate</span>
                    <Badge className="bg-primary-100 text-primary-800 border-primary-200 font-semibold">
                      {stats.total_customers > 0 ? 
                        Math.round((stats.with_multiple_contacts / stats.total_customers) * 100) : 0
                      }%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="space-y-4 pt-4 lg:pt-0 lg:pl-8">
                <h4 className="font-semibold text-primary-800 text-base">Database Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Total Records</span>
                    <Badge className="bg-primary-100 text-primary-800 border-primary-200 font-semibold">
                      {stats.total_customers} customers
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-primary-600">Contact Coverage</span>
                    <Badge className="bg-primary-100 text-primary-800 border-primary-200 font-semibold">
                      {stats.with_multiple_contacts + stats.total_customers} contacts
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Search and Management */}
      <div className="bg-white rounded-lg border border-primary-200 shadow-sm">
        <div className="p-6 border-b border-primary-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-primary-800 font-montserrat">
                Customer Management
              </h3>
              <p className="text-primary-600 mt-2">
                Search and manage your customer database
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => setIsCsvImportOpen(true)}
                className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn-warning flex items-center justify-center gap-2 w-full sm:w-auto bg-clearpoint-amber hover:bg-clearpoint-amber/90 text-clearpoint-navy border-clearpoint-amber"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Customer</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <CustomerSearchBar
            onSearch={search}
            isLoading={isSearchLoading}
            resultsCount={hasSearched ? totalCount : undefined}
            onClear={clearSearch}
            customers={customers || []}
          />
        </div>

        {/* Results */}
        <div>
          {/* Loading State */}
          {isSearchLoading && (
            <CustomerTable
              customers={[]}
              isLoading={true}
              onCustomerClick={handleCustomerClick}
              customerTypeFilter={searchParams.customerType || undefined}
            />
          )}

          {/* Error State */}
          {isSearchError && (
            <CustomerEmptyStates
              type="error"
              error={(searchError as Error)?.message}
              onRetry={refetchSearch}
              onClear={clearSearch}
            />
          )}

          {/* No Search Yet */}
          {!hasSearched && !isSearchLoading && (
            <CustomerEmptyStates type="initial" />
          )}

          {/* No Results */}
          {hasSearched && !isSearchLoading && !isSearchError && customers.length === 0 && (
            <CustomerEmptyStates
              type="no-results"
              searchTerm={searchParams.searchTerm}
              customerType={searchParams.customerType}
              onClear={clearSearch}
            />
          )}

          {/* Results Table */}
          {hasSearched && !isSearchLoading && !isSearchError && customers.length > 0 && (
            <CustomerTable
              customers={customers}
              isLoading={false}
              onCustomerClick={handleCustomerClick}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
              pageSize={25}
              customerTypeFilter={searchParams.customerType}
            />
          )}
        </div>
      </div>

      {/* Customer Sidebar */}
      <CustomerSidebar
        customer={selectedCustomer}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        customer={customerToEdit}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSuccess={handleAddSuccess}
      />

      {/* Delete Customer Modal */}
      <DeleteCustomerModal
        customer={customerToDelete}
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onSuccess={handleDeleteSuccess}
      />

      {/* CSV Import Modal */}
      <CustomerCsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={handleCsvImportSuccess}
      />
    </div>
  )
}