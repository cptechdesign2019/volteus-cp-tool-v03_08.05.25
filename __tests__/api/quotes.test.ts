import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createQuote, getQuotes, getQuoteById, updateQuote, deleteQuote, createQuoteOption, getQuoteOptions } from '@/lib/api/quotes'

// Mock Supabase
const mockSupabaseResponse = {
  data: null,
  error: null
}

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue(mockSupabaseResponse)
}

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('Quotes API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseResponse.data = null
    mockSupabaseResponse.error = null
    
    // Reset all mock functions to return the chain properly
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.single.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue(mockSupabaseResponse)
  })

  describe('createQuote', () => {
    it('should create a quote successfully', async () => {
      const mockQuoteData = {
        id: 'quote-1',
        quote_number: 'CPQ-25001',
        title: 'Test Quote',
        description: 'Test description',
        customer_id: 'customer-1',
        sales_rep_id: 'user-1',
        quote_status: 'draft' as const,
        total_price: 1000,
        total_cost: 800,
        gross_profit_margin: 20,
        version: 1,
        created_at: '2025-01-08T10:00:00Z',
        updated_at: '2025-01-08T10:00:00Z',
        created_by: 'test-user-id',
        updated_by: 'test-user-id'
      }

      mockSupabaseResponse.data = mockQuoteData
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await createQuote({
        title: 'Test Quote',
        description: 'Test description',
        customer_id: 'customer-1'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockQuoteData)
      expect(mockSupabase.from).toHaveBeenCalledWith('quotes')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should fail without required fields', async () => {
      const result = await createQuote({
        description: 'Missing title and customer_id'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Title and customer_id are required')
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await createQuote({
        title: 'Test Quote',
        customer_id: 'customer-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle database errors', async () => {
      mockSupabaseResponse.error = { message: 'Database connection failed' }
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await createQuote({
        title: 'Test Quote',
        customer_id: 'customer-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('getQuotes', () => {
    it('should fetch all quotes successfully', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          quote_number: 'CPQ-25001',
          title: 'Test Quote 1',
          customer_id: 'customer-1',
          quote_status: 'draft',
          total_price: 1000,
          created_at: '2025-01-08T10:00:00Z'
        },
        {
          id: 'quote-2',
          quote_number: 'CPQ-25002',
          title: 'Test Quote 2',
          customer_id: 'customer-2',
          quote_status: 'sent',
          total_price: 2000,
          created_at: '2025-01-08T11:00:00Z'
        }
      ]

      mockSupabaseResponse.data = mockQuotes
      mockSupabase.order.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuotes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockQuotes)
      expect(mockSupabase.from).toHaveBeenCalledWith('quotes')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should handle empty results', async () => {
      mockSupabaseResponse.data = []
      mockSupabase.order.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuotes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSupabaseResponse.error = { message: 'Database error' }
      mockSupabase.order.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuotes()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('getQuoteById', () => {
    it('should fetch a specific quote successfully', async () => {
      const mockQuote = {
        id: 'quote-1',
        quote_number: 'CPQ-25001',
        title: 'Test Quote',
        customer_id: 'customer-1',
        quote_status: 'draft',
        total_price: 1000
      }

      mockSupabaseResponse.data = mockQuote
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuoteById('quote-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockQuote)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'quote-1')
    })

    it('should handle quote not found', async () => {
      mockSupabaseResponse.error = { message: 'Quote not found' }
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuoteById('nonexistent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Quote not found')
    })
  })

  describe('updateQuote', () => {
    it('should update a quote successfully', async () => {
      const updatedQuote = {
        id: 'quote-1',
        title: 'Updated Quote',
        quote_status: 'sent' as const,
        total_price: 1500,
        updated_by: 'test-user-id'
      }

      mockSupabaseResponse.data = updatedQuote
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await updateQuote('quote-1', {
        title: 'Updated Quote',
        quote_status: 'sent',
        total_price: 1500
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedQuote)
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'quote-1')
    })

    it('should handle update authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await updateQuote('quote-1', { title: 'Updated' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })
  })

  describe('deleteQuote', () => {
    it('should delete a quote successfully', async () => {
      mockSupabaseResponse.error = null
      // Mock the full chain: from().delete().eq()
      mockSupabase.eq.mockResolvedValue(mockSupabaseResponse)

      const result = await deleteQuote('quote-1')

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('quotes')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'quote-1')
    })

    it('should handle delete errors', async () => {
      mockSupabaseResponse.error = { message: 'Cannot delete quote' }
      // Mock the full chain: from().delete().eq()
      mockSupabase.eq.mockResolvedValue(mockSupabaseResponse)

      const result = await deleteQuote('quote-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete quote')
    })
  })

  describe('createQuoteOption', () => {
    it('should create a quote option successfully', async () => {
      const mockOption = {
        id: 'option-1',
        quote_id: 'quote-1',
        option_name: 'Premium Package',
        total_equipment_cost: 5000,
        total_labor_cost: 2000,
        total_customer_price: 8000,
        is_selected: false
      }

      mockSupabaseResponse.data = mockOption
      mockSupabase.single.mockResolvedValue(mockSupabaseResponse)

      const result = await createQuoteOption({
        quote_id: 'quote-1',
        option_name: 'Premium Package',
        total_equipment_cost: 5000,
        total_labor_cost: 2000,
        total_customer_price: 8000
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOption)
      expect(mockSupabase.from).toHaveBeenCalledWith('quote_options')
    })

    it('should fail without required fields', async () => {
      const result = await createQuoteOption({
        option_name: 'Missing quote_id'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('quote_id and option_name are required')
    })
  })

  describe('getQuoteOptions', () => {
    it('should fetch quote options successfully', async () => {
      const mockOptions = [
        {
          id: 'option-1',
          quote_id: 'quote-1',
          option_name: 'Basic Package',
          total_customer_price: 5000,
          is_selected: true
        },
        {
          id: 'option-2',
          quote_id: 'quote-1',
          option_name: 'Premium Package',
          total_customer_price: 8000,
          is_selected: false
        }
      ]

      mockSupabaseResponse.data = mockOptions
      mockSupabaseResponse.error = null
      mockSupabase.order.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuoteOptions('quote-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOptions)
      expect(mockSupabase.eq).toHaveBeenCalledWith('quote_id', 'quote-1')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected network error')
      })

      const result = await createQuote({
        title: 'Test Quote',
        customer_id: 'customer-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unexpected network error')
    })

    it('should handle malformed response data', async () => {
      mockSupabaseResponse.data = undefined
      mockSupabaseResponse.error = null // Ensure no error is set
      mockSupabase.order.mockResolvedValue(mockSupabaseResponse)

      const result = await getQuotes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })
})
