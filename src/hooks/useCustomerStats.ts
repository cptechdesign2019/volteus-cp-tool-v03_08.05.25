import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useRealTimeCustomerStats() {
  const { data, isLoading, error, isError, isStale, isRefetching, refetch } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const supabase = createClient()
      
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('customer_accounts')
        .select('*', { count: 'exact', head: true })
      
      // Get residential count
      const { count: residentialCount } = await supabase
        .from('customer_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('customer_type', 'Residential')
      
      // Get commercial count
      const { count: commercialCount } = await supabase
        .from('customer_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('customer_type', 'Commercial')
      
      // Get recent additions (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: recentAdditions } = await supabase
        .from('customer_accounts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      // Get customers with multiple contacts
      const { data: contactCounts } = await supabase
        .from('customer_contacts')
        .select('customer_account_id')
      
      const accountContactCounts = contactCounts?.reduce((acc: any, contact: any) => {
        acc[contact.customer_account_id] = (acc[contact.customer_account_id] || 0) + 1
        return acc
      }, {}) || {}
      
      const withMultipleContacts = Object.values(accountContactCounts).filter((count: any) => count > 1).length
      
      return {
        total_customers: totalCustomers || 0,
        residential_count: residentialCount || 0,
        commercial_count: commercialCount || 0,
        recent_additions: recentAdditions || 0,
        with_multiple_contacts: withMultipleContacts
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000 // Consider data stale after 10 seconds
  })

  return {
    data: data || {
      total_customers: 0,
      residential_count: 0,
      commercial_count: 0,
      recent_additions: 0,
      with_multiple_contacts: 0
    },
    isLoading,
    error,
    isError,
    isStale,
    isRefetching,
    lastUpdated: Date.now(),
    refetchStats: refetch
  }
}