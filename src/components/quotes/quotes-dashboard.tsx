'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Search, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { getQuotes, deleteQuote, type Quote } from '@/lib/api/quotes'
import { getCustomerAccounts } from '@/lib/api/customers'
import { useDebounce } from '@/hooks/useDebounce'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateQuoteModal } from '@/components/quotes/create-quote-modal'

interface Customer {
  id: string
  company_name: string
}

export function QuotesDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const queryClient = useQueryClient()

  // Fetch quotes
  const { data: quotes = [], isLoading: quotesLoading, error: quotesError } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const result = await getQuotes()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quotes')
      }
      return result.data || []
    }
  })

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customer-accounts'],
    queryFn: async () => {
      const result = await getCustomerAccounts()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch customers')
      }
      return result.data || []
    }
  })

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
    onError: (error: any) => {
      console.error('Error deleting quote:', error)
      alert('Failed to delete quote: ' + (error.message || 'Unknown error'))
    }
  })

  // Filter quotes based on search and status
  const filteredQuotes = quotes.filter((quote: Quote) => {
    const customer = customers.find((c: Customer) => c.id === quote.customer_id)
    const customerName = customer?.company_name || ''
    
    const matchesSearch = !debouncedSearchTerm || 
      quote.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || quote.quote_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate summary stats
  const totalQuotes = quotes.length
  const draftQuotes = quotes.filter((q: Quote) => q.quote_status === 'draft').length
  const sentQuotes = quotes.filter((q: Quote) => q.quote_status === 'sent').length
  const acceptedQuotes = quotes.filter((q: Quote) => q.quote_status === 'accepted').length
  const totalValue = quotes.reduce((sum: number, q: Quote) => sum + (q.total_price || 0), 0)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'sent':
        return 'bg-clearpoint-cyan/10 text-clearpoint-cyan border-clearpoint-cyan/30'
      case 'pending_changes':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'archived':
        return 'bg-gray-100 text-gray-600 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDeleteQuote = async (quoteId: string, quoteNumber: string) => {
    if (window.confirm(`Are you sure you want to delete quote ${quoteNumber}? This action cannot be undone.`)) {
      deleteQuoteMutation.mutate(quoteId)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-primary-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-800 font-montserrat">
              Quotes Management
            </h1>
            <p className="text-primary-600 mt-2">
              Create, manage, and track your project quotes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="btn-warning bg-clearpoint-amber text-clearpoint-navy hover:bg-clearpoint-amber/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-clearpoint-navy" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-clearpoint-navy">{totalQuotes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">D</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-700">{draftQuotes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-clearpoint-cyan/10 flex items-center justify-center">
              <span className="text-sm font-medium text-clearpoint-cyan">S</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-clearpoint-cyan">{sentQuotes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-medium text-green-600">A</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{acceptedQuotes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-clearpoint-amber/10 flex items-center justify-center">
              <span className="text-sm font-medium text-clearpoint-amber">$</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-clearpoint-navy">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-primary-200 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input - matching Product Library exactly */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 bg-clearpoint-platinum border border-clearpoint-silver rounded-lg">
                <Search className="h-4 w-4 text-clearpoint-slateGray" />
              </div>
              <Input
                placeholder="Search quotes by number, title, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-12 placeholder-clearpoint-slateGray"
              />
            </div>

            {/* Status Filter - matching Product Library style */}
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-12 border-clearpoint-silver text-clearpoint-navy">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending_changes">Pending Changes</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotesLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading quotes...
                  </td>
                </tr>
              ) : quotesError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    Error loading quotes: {quotesError.message}
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {debouncedSearchTerm || statusFilter !== 'all' 
                      ? 'No quotes match your search criteria.'
                      : 'No quotes yet. Create your first quote!'}
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote: Quote) => {
                  const customer = customers.find((c: Customer) => c.id === quote.customer_id)
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.quote_number}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {quote.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer?.company_name || 'Unknown Customer'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadgeClass(quote.quote_status)}>
                          {quote.quote_status.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(quote.total_price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4 text-clearpoint-coral" />
                              View Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteQuote(quote.id, quote.quote_number)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Quote
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          queryClient.invalidateQueries({ queryKey: ['quotes'] })
        }}
      />
    </div>
  )
}
