import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface SearchParams {
  searchTerm: string
  customerType: string | null
  page: number
  limit: number
}

export function useCustomerSearch() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchTerm: '',
    customerType: null,
    page: 1,
    limit: 10
  })
  
  const [hasSearched, setHasSearched] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-search', searchParams],
    queryFn: async () => {
      const supabase = createClient()
      
      // Build the base query
      // Simplified query without joins to debug relationship issue
      let query = supabase
        .from('customer_accounts')
        .select('*', { count: 'exact' })
      
      // Add search term filter (search only in company name for now)
      if (searchParams.searchTerm.trim()) {
        query = query.ilike('company_name', `%${searchParams.searchTerm}%`)
      }
      
      // Add customer type filter
      if (searchParams.customerType) {
        query = query.eq('customer_type', searchParams.customerType)
      }
      
      // Add pagination
      const from = (searchParams.page - 1) * searchParams.limit
      const to = from + searchParams.limit - 1
      
      const { data: customers, error: customersError, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })
      
      if (customersError) {
        console.error('Search error:', customersError)
        throw customersError
      }
      
      console.log('Search results:', { customers, count, searchParams })
      
      return {
        customers: customers || [],
        totalCount: count || 0
      }
    },
    enabled: true // Always enabled to show all customers by default
  })

  const search = (searchTerm: string, customerType: string | null) => {
    setSearchParams(prev => ({
      ...prev,
      searchTerm,
      customerType,
      page: 1 // Reset to first page on new search
    }))
    setHasSearched(true)
  }

  const changePage = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  const clearSearch = () => {
    setSearchParams({
      searchTerm: '',
      customerType: null,
      page: 1,
      limit: 10
    })
    setHasSearched(false)
  }

  const totalPages = Math.ceil((data?.totalCount || 0) / searchParams.limit)
  const hasActiveSearch = searchParams.searchTerm.trim() !== '' || searchParams.customerType !== null

  return {
    customers: data?.customers || [],
    totalCount: data?.totalCount || 0,
    totalPages,
    currentPage: searchParams.page,
    searchParams: {
      searchTerm: searchParams.searchTerm,
      customerType: searchParams.customerType
    },
    hasSearched,
    hasActiveSearch,
    isLoading,
    isError,
    error,
    search,
    changePage,
    clearSearch,
    refetch
  }
}