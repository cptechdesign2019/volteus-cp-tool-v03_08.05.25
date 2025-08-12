import { createClient } from '@/lib/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Types for quotes management
export interface Quote {
  id: string
  quote_number: string
  title: string
  description?: string
  customer_id: string
  sales_rep_id: string
  quote_status: 'draft' | 'sent' | 'pending_changes' | 'accepted' | 'expired' | 'archived'
  total_price: number
  total_cost: number
  total_equipment_cost?: number
  total_labor_cost?: number
  total_customer_price?: number
  gross_profit_margin: number
  expiration_date?: string
  accepted_at?: string
  accepted_by?: string
  scope_of_work?: string
  internal_notes?: string
  notes?: string
  tags?: string[]
  version: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface QuoteOption {
  id: string
  quote_id: string
  option_name: string
  option_description?: string
  total_equipment_cost: number
  total_labor_cost: number
  total_customer_price: number
  is_selected: boolean
  created_at: string
  updated_at: string
}

export interface QuoteArea {
  id: string
  quote_option_id: string
  area_name: string
  description?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface QuoteEquipment {
  id: string
  quote_area_id: string
  product_id: string
  quantity: number
  unit_price: number
  unit_cost: number
  total_price: number
  total_cost: number
  notes?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface QuoteLabor {
  id: string
  quote_option_id: string
  labor_type: string
  hours: number
  rate: number
  total_price: number
  total_cost: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Create a new quote
 */
export async function createQuote(quoteData: Partial<Quote>): Promise<APIResponse<Quote>> {
  try {
    const supabase = createClient()
    
    // Get current user for audit fields
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate required fields
    if (!quoteData.title || !quoteData.customer_id) {
      return { success: false, error: 'Title and customer_id are required' }
    }

    // Generate quote number using database function
    const { data: quoteNumberData, error: quoteNumberError } = await supabase
      .rpc('generate_quote_number')
    
    if (quoteNumberError) {
      console.error('Error generating quote number:', quoteNumberError)
      return { success: false, error: 'Failed to generate quote number: ' + quoteNumberError.message }
    }

    // Prepare quote data with audit fields
    const newQuote = {
      quote_number: quoteNumberData,
      title: quoteData.title,
      description: quoteData.description || null,
      customer_id: quoteData.customer_id,
      sales_rep_id: quoteData.sales_rep_id || user.id,
      quote_status: quoteData.quote_status || 'draft',
      total_price: quoteData.total_price || 0,
      total_cost: quoteData.total_cost || 0,
      gross_profit_margin: quoteData.gross_profit_margin || 0,
      expiration_date: quoteData.expiration_date || null,
      notes: quoteData.notes || null,
      tags: quoteData.tags || [],
      version: 1,
      created_by: user.id,
      updated_by: user.id
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert(newQuote)
      .select()
      .single()

    if (error) {
      console.error('Error creating quote:', error)
      return { success: false, error: error.message || error.details || 'Unknown database error' }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error creating quote:', error)
    return { success: false, error: error.message || 'Failed to create quote' }
  }
}

export interface QuoteFilters {
  status?: string
  salesRep?: string
  customer?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

/**
 * Get quotes with filtering and search capabilities
 */
export async function getQuotes(filters?: QuoteFilters): Promise<APIResponse<Quote[]>> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('quotes')
      .select(`
        *,
        customer_accounts!inner(company_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('quote_status', filters.status)
    }

    if (filters?.salesRep) {
      query = query.eq('sales_rep_id', filters.salesRep)
    }

    if (filters?.customer) {
      query = query.eq('customer_id', filters.customer)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Text search across quote_number, title, and description
    if (filters?.search) {
      query = query.or(`quote_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching quotes:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Unexpected error fetching quotes:', error)
    return { success: false, error: error.message || 'Failed to fetch quotes' }
  }
}

/**
 * Get a specific quote by ID
 */
export async function getQuoteById(quoteId: string): Promise<APIResponse<Quote>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error) {
      console.error('Error fetching quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error fetching quote:', error)
    return { success: false, error: error.message || 'Failed to fetch quote' }
  }
}

// Valid quote status transitions
const QUOTE_STATUS_TRANSITIONS: Record<string, string[]> = {
  'draft': ['sent', 'archived'],
  'sent': ['pending_changes', 'accepted', 'expired', 'archived'],
  'pending_changes': ['draft', 'sent', 'archived'],
  'accepted': ['archived'],
  'expired': ['draft', 'archived'],
  'archived': [] // No transitions from archived
}

/**
 * Validate quote status transition
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true // Same status is always valid
  const allowedTransitions = QUOTE_STATUS_TRANSITIONS[currentStatus] || []
  return allowedTransitions.includes(newStatus)
}

/**
 * Update an existing quote with status workflow validation
 */
export async function updateQuote(quoteId: string, updates: Partial<Quote>): Promise<APIResponse<Quote>> {
  try {
    const supabase = createClient()
    
    // Get current user for audit fields
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // If updating status, validate the transition
    if (updates.quote_status) {
      // Get current quote to check status
      const { data: currentQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('quote_status')
        .eq('id', quoteId)
        .single()

      if (fetchError) {
        console.error('Error fetching current quote:', fetchError)
        return { success: false, error: 'Quote not found' }
      }

      if (!isValidStatusTransition(currentQuote.quote_status, updates.quote_status)) {
        return { 
          success: false, 
          error: `Invalid status transition from '${currentQuote.quote_status}' to '${updates.quote_status}'` 
        }
      }

      // Set accepted_at timestamp when status changes to 'accepted'
      if (updates.quote_status === 'accepted') {
        updates.accepted_at = new Date().toISOString()
        updates.accepted_by = user.id
      }
    }

    // Add updated_by field and timestamp
    const updateData = {
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single()

    if (error) {
      console.error('Error updating quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error updating quote:', error)
    return { success: false, error: error.message || 'Failed to update quote' }
  }
}

/**
 * Delete a quote with dependency checking
 */
export async function deleteQuote(quoteId: string): Promise<APIResponse<void>> {
  try {
    const supabase = createClient()
    
    // Check if quote exists and get its status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('quote_status')
      .eq('id', quoteId)
      .single()

    if (fetchError) {
      console.error('Error fetching quote for deletion:', fetchError)
      return { success: false, error: 'Quote not found' }
    }

    // Prevent deletion of accepted quotes
    if (quote.quote_status === 'accepted') {
      return { 
        success: false, 
        error: 'Cannot delete accepted quotes. Archive them instead.' 
      }
    }

    // Check for dependencies - quote options
    const { data: options, error: optionsError } = await supabase
      .from('quote_options')
      .select('id')
      .eq('quote_id', quoteId)
      .limit(1)

    if (optionsError) {
      console.error('Error checking quote options:', optionsError)
      return { success: false, error: 'Failed to check quote dependencies' }
    }

    // If there are quote options, prevent deletion
    if (options && options.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete quote with existing options and areas. Please remove all quote content first or archive the quote.' 
      }
    }

    // Proceed with deletion if no dependencies
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)

    if (error) {
      console.error('Error deleting quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error deleting quote:', error)
    return { success: false, error: error.message || 'Failed to delete quote' }
  }
}

/**
 * Duplicate an existing quote
 */
export async function duplicateQuote(quoteId: string, newTitle?: string): Promise<APIResponse<Quote>> {
  try {
    const supabase = createClient()
    
    // Get current user for audit fields
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get the original quote
    const { data: originalQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (fetchError) {
      console.error('Error fetching original quote:', fetchError)
      return { success: false, error: 'Original quote not found' }
    }

    // Generate new quote number
    const { data: quoteNumberData, error: quoteNumberError } = await supabase
      .rpc('generate_quote_number')
    
    if (quoteNumberError) {
      console.error('Error generating quote number:', quoteNumberError)
      return { success: false, error: 'Failed to generate quote number: ' + quoteNumberError.message }
    }

    // Prepare duplicated quote data
    const duplicatedQuote = {
      quote_number: quoteNumberData,
      title: newTitle || `Copy of ${originalQuote.title}`,
      description: originalQuote.description,
      customer_id: originalQuote.customer_id,
      sales_rep_id: user.id, // Assign to current user
      quote_status: 'draft', // Always start as draft
      total_price: originalQuote.total_price,
      total_cost: originalQuote.total_cost,
      gross_profit_margin: originalQuote.gross_profit_margin,
      expiration_date: null, // Reset expiration
      notes: originalQuote.notes,
      tags: originalQuote.tags,
      version: 1, // Reset version
      created_by: user.id,
      updated_by: user.id
    }

    // Create the duplicated quote
    const { data: newQuote, error: createError } = await supabase
      .from('quotes')
      .insert(duplicatedQuote)
      .select()
      .single()

    if (createError) {
      console.error('Error creating duplicated quote:', createError)
      return { success: false, error: createError.message }
    }

    return { success: true, data: newQuote }
  } catch (error: any) {
    console.error('Unexpected error duplicating quote:', error)
    return { success: false, error: error.message || 'Failed to duplicate quote' }
  }
}

/**
 * Create a quote option for a quote
 */
export async function createQuoteOption(optionData: Partial<QuoteOption>): Promise<APIResponse<QuoteOption>> {
  try {
    const supabase = createClient()
    
    if (!optionData.quote_id || !optionData.option_name) {
      return { success: false, error: 'quote_id and option_name are required' }
    }

    const { data, error } = await supabase
      .from('quote_options')
      .insert(optionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating quote option:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error creating quote option:', error)
    return { success: false, error: error.message || 'Failed to create quote option' }
  }
}

/**
 * Get quote options for a specific quote
 */
export async function getQuoteOptions(quoteId: string): Promise<APIResponse<QuoteOption[]>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quote_options')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching quote options:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Unexpected error fetching quote options:', error)
    return { success: false, error: error.message || 'Failed to fetch quote options' }
  }
}
