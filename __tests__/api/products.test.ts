/**
 * Products API Tests
 * Testing our enhanced batch creation and authentication patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { batchCreateProducts, validateProductForAPI } from '../../src/lib/api/products'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    upsert: vi.fn(() => ({
      select: vi.fn()
    }))
  }))
}

// Mock the createClient function
vi.mock('../../src/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateProductForAPI', () => {
    it('should validate complete product data successfully', () => {
      const productData = {
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker',
        product_number: 'TS-100',
        description: 'High quality test speaker',
        dealer_price: 99.99,
        msrp: 199.99,
        map_price: 149.99,
        primary_distributor: 'TestDist',
        secondary_distributor: 'TestDist2',
        tertiary_distributor: 'TestDist3',
        spec_sheet_url: 'https://example.com/spec.pdf',
        image_url: 'https://example.com/image.jpg'
      }

      const errors = validateProductForAPI(productData)
      expect(errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const incompleteData = {
        product_id: 'PROD10001',
        brand: '', // Missing required field
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }

      const errors = validateProductForAPI(incompleteData)
      expect(errors.some(error => error.includes('Brand is required'))).toBe(true)
    })

    it('should validate price field formats', () => {
      const invalidPriceData = {
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker',
        dealer_price: 'invalid_price',
        msrp: -100, // Negative price
        map_price: 'not_a_number'
      }

      const errors = validateProductForAPI(invalidPriceData)
      expect(errors.some(error => error.includes('Dealer price must be a positive number'))).toBe(true)
      expect(errors.some(error => error.includes('MSRP must be a positive number'))).toBe(true)
      expect(errors.some(error => error.includes('MAP price must be a positive number'))).toBe(true)
    })

    it('should validate URL formats', () => {
      const invalidURLData = {
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker',
        spec_sheet_url: 'invalid-url',
        image_url: 'not-a-url'
      }

      const errors = validateProductForAPI(invalidURLData)
      expect(errors.some(error => error.includes('Spec Sheet URL must be a valid URL'))).toBe(true)
      expect(errors.some(error => error.includes('Image URL must be a valid URL'))).toBe(true)
    })

    it('should handle string prices and convert them', () => {
      const stringPriceData = {
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker',
        dealer_price: '$99.99',
        msrp: '199.99',
        map_price: '1,234.56'
      }

      const errors = validateProductForAPI(stringPriceData)
      expect(errors).toHaveLength(0)
      
      // Prices should be converted to numbers
      expect(typeof stringPriceData.dealer_price).toBe('number')
      expect(stringPriceData.dealer_price).toBe(99.99)
    })

    it('should accept empty optional fields', () => {
      const minimalData = {
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
        // All other fields empty/undefined
      }

      const errors = validateProductForAPI(minimalData)
      expect(errors).toHaveLength(0)
    })
  })

  describe('batchCreateProducts', () => {
    it('should return error for empty products array', async () => {
      const result = await batchCreateProducts([])

      expect(result.success).toBe(false)
      expect(result.error).toBe('No products provided')
    })

    it('should return error for batch size exceeding limit', async () => {
      const largeArray = new Array(1001).fill({
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      })

      const result = await batchCreateProducts(largeArray)

      expect(result.success).toBe(false)
      expect(result.error).toContain('maximum limit')
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const products = [{
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }]

      const result = await batchCreateProducts(products)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated. Please log in and try again.')
    })

    it('should successfully process valid products with authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockInsertedData = [{
        id: 1,
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker',
        created_by: 'user-123',
        updated_by: 'user-123'
      }]

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockInsertedData,
            error: null
          })
        })
      })

      const products = [{
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }]

      const result = await batchCreateProducts(products)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInsertedData)
      expect(result.summary?.created).toBe(1)
      expect(result.summary?.total).toBe(1)
    })

    it('should handle validation errors and return partial success', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const products = [
        {
          product_id: 'PROD10001',
          brand: 'TestBrand',
          category: 'Audio Equipment',
          product_name: 'Test Speaker'
        },
        {
          product_id: '', // Invalid - missing product ID
          brand: 'TestBrand',
          category: 'Audio Equipment',
          product_name: 'Test Speaker'
        }
      ]

      const result = await batchCreateProducts(products)

      // Current implementation returns success with partial errors. Validate summary instead.
      expect(result.summary?.failed).toBe(1)
      expect(result.summary?.errors).toBeDefined()
      expect(result.summary?.errors![0]).toContain('Product ID is required')
    })

    it('should call progress callback during processing', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1, product_id: 'PROD10001' }],
            error: null
          })
        })
      })

      const progressCallback = vi.fn()
      const products = [{
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }]

      await batchCreateProducts(products, progressCallback)

      expect(progressCallback).toHaveBeenCalled()
      // Should be called at least twice: start and end
      expect(progressCallback).toHaveBeenCalledWith(0, 1, 0)
      expect(progressCallback).toHaveBeenCalledWith(1, 1, 1)
    })

    it('should add audit fields to products', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null
        })
      })

      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert
      })

      const products = [{
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }]

      await batchCreateProducts(products)

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            created_by: 'user-123',
            updated_by: 'user-123'
          })
        ]),
        {
          onConflict: 'product_id',
          ignoreDuplicates: false
        }
      )
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const products = [{
        product_id: 'PROD10001',
        brand: 'TestBrand',
        category: 'Audio Equipment',
        product_name: 'Test Speaker'
      }]

      const result = await batchCreateProducts(products)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })
  })
})