/**
 * Product API Operations
 * Handles all CRUD operations, search, filtering, and batch operations for products
 * Migrated from Todd's JavaScript implementation to TypeScript with ES6 imports
 */

import { createClient } from '@/lib/supabase/client'

// Product interface matching our database schema
export interface Product {
  id: string
  product_id: string
  brand: string
  category: string
  product_name: string
  product_number?: string
  description?: string
  dealer_price?: number
  msrp?: number
  map_price?: number
  primary_distributor?: string
  secondary_distributor?: string
  tertiary_distributor?: string
  spec_sheet_url?: string
  image_url?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

// API Response interface
interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary?: {
    total?: number
    created?: number
    updated?: number
    deleted?: number
    failed?: number
    totalProducts?: number
    errors?: string[]
  }
  timestamp: string
}

// Search parameters interface
export interface ProductSearchParams {
  searchTerm?: string
  brand?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Maximum batch size for bulk operations
const MAX_BATCH_SIZE = 1000
const OPTIMAL_CHUNK_SIZE = 50

/**
 * Standardized API response format
 */
function createResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  pagination: APIResponse['pagination'] | null = null,
  summary: APIResponse['summary'] | null = null
): APIResponse<T> {
  return {
    success,
    data,
    error,
    pagination,
    summary,
    timestamp: new Date().toISOString()
  }
}

/**
 * Validate required product fields for API operations
 */
export function validateProductForAPI(productData: Partial<Product>, isUpdate = false): string[] {
  const errors: string[] = []
  
  if (!isUpdate) {
    // Required fields for creation
    if (!productData.product_id) errors.push('Product ID is required')
    if (!productData.brand) errors.push('Brand is required')
    if (!productData.category) errors.push('Category is required')
    if (!productData.product_name) errors.push('Product Name is required')
  }
  
  // Validate and convert data types and constraints
  if (productData.dealer_price !== undefined && productData.dealer_price !== null) {
    if (typeof productData.dealer_price === 'string') {
      const cleanValue = productData.dealer_price.replace(/[$,\s]/g, '')
      const numeric = parseFloat(cleanValue)
      if (isNaN(numeric) || numeric < 0) {
        errors.push('Dealer price must be a positive number')
      } else {
        productData.dealer_price = numeric as any
      }
    } else if (typeof productData.dealer_price !== 'number' || productData.dealer_price < 0) {
      errors.push('Dealer price must be a positive number')
    }
  }
  
  if (productData.msrp !== undefined && productData.msrp !== null) {
    if (typeof productData.msrp === 'string') {
      const cleanValue = productData.msrp.replace(/[$,\s]/g, '')
      const numeric = parseFloat(cleanValue)
      if (isNaN(numeric) || numeric < 0) {
        errors.push('MSRP must be a positive number')
      } else {
        productData.msrp = numeric as any
      }
    } else if (typeof productData.msrp !== 'number' || productData.msrp < 0) {
      errors.push('MSRP must be a positive number')
    }
  }
  
  if (productData.map_price !== undefined && productData.map_price !== null) {
    if (typeof productData.map_price === 'string') {
      const cleanValue = productData.map_price.replace(/[$,\s]/g, '')
      const numeric = parseFloat(cleanValue)
      if (isNaN(numeric) || numeric < 0) {
        errors.push('MAP price must be a positive number')
      } else {
        productData.map_price = numeric as any
      }
    } else if (typeof productData.map_price !== 'number' || productData.map_price < 0) {
      errors.push('MAP price must be a positive number')
    }
  }
  
  // Validate URLs if provided
  if (productData.spec_sheet_url) {
    try {
      new URL(productData.spec_sheet_url)
    } catch {
      errors.push('Spec Sheet URL must be a valid URL')
    }
  }
  
  if (productData.image_url) {
    try {
      new URL(productData.image_url)
    } catch {
      errors.push('Image URL must be a valid URL')
    }
  }
  
  return errors
}

/**
 * Search products with advanced filtering and pagination
 */
export async function searchProducts(params: ProductSearchParams = {}): Promise<APIResponse<Product[]>> {
  try {
    const supabase = createClient()
    const {
      searchTerm = '',
      brand,
      category,
      minPrice,
      maxPrice,
      sortBy = 'product_name',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = params

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Apply search term filter (searches product name, description, and product number)
    if (searchTerm && searchTerm.trim()) {
      query = query.or(
        `product_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,product_number.ilike.%${searchTerm}%`
      )
    }

    // Apply brand filter
    if (brand && brand !== 'all') {
      query = query.eq('brand', brand)
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Apply price range filters
    if (minPrice !== undefined) {
      query = query.gte('dealer_price', minPrice)
    }
    if (maxPrice !== undefined) {
      query = query.lte('dealer_price', maxPrice)
    }

    // Apply sorting
    const validSortColumns = ['product_name', 'brand', 'category', 'dealer_price', 'msrp', 'created_at']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'product_name'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Product search error:', error)
      return createResponse(false, null, error.message)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return createResponse(
      true,
      data || [],
      null,
      { page, limit, total, totalPages }
    )
  } catch (error) {
    console.error('Product search error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to search products')
  }
}

/**
 * Get distinct brands for filter options
 */
export async function getDistinctBrands(): Promise<APIResponse<string[]>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .order('brand')

    if (error) {
      return createResponse(false, null, error.message)
    }

    // Extract unique brands
    const brands = [...new Set(data?.map(item => item.brand).filter(Boolean))] as string[]
    
    return createResponse(true, brands)
  } catch (error) {
    console.error('Get distinct brands error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to get brands')
  }
}

/**
 * Get distinct categories for filter options
 */
export async function getDistinctCategories(): Promise<APIResponse<string[]>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .order('category')

    if (error) {
      return createResponse(false, null, error.message)
    }

    // Extract unique categories
    const categories = [...new Set(data?.map(item => item.category).filter(Boolean))] as string[]
    
    return createResponse(true, categories)
  } catch (error) {
    console.error('Get distinct categories error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to get categories')
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<APIResponse<Product>> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return createResponse(false, null, error.message)
    }

    return createResponse(true, data)
  } catch (error) {
    console.error('Get product error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to get product')
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Product>> {
  try {
    const supabase = createClient()
    
    // Validate product data
    const validationErrors = validateProductForAPI(productData, false)
    if (validationErrors.length > 0) {
      return createResponse(false, null, `Validation errors: ${validationErrors.join(', ')}`)
    }

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (error) {
      return createResponse(false, null, error.message)
    }

    return createResponse(true, data)
  } catch (error) {
    console.error('Create product error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to create product')
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<APIResponse<Product>> {
  try {
    const supabase = createClient()
    
    // Validate product data
    const validationErrors = validateProductForAPI(productData, true)
    if (validationErrors.length > 0) {
      return createResponse(false, null, `Validation errors: ${validationErrors.join(', ')}`)
    }

    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createResponse(false, null, error.message)
    }

    return createResponse(true, data)
  } catch (error) {
    console.error('Update product error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to update product')
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<APIResponse<null>> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      return createResponse(false, null, error.message)
    }

    return createResponse(true, null)
  } catch (error) {
    console.error('Delete product error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to delete product')
  }
}

/**
 * Create multiple products in optimized batches (Based on Todd's Working Implementation)
 * Processes large datasets in chunks for better performance and progress tracking
 */
export async function batchCreateProducts(
  products: any[], 
  onProgress?: (chunkIndex: number, totalChunks: number, processedCount: number) => void
): Promise<APIResponse<Product[]>> {
  try {
    // Validate batch size
    if (!products || products.length === 0) {
      return createResponse(false, null, 'No products provided')
    }

    if (products.length > MAX_BATCH_SIZE) {
      return createResponse(false, null, `Batch size exceeds maximum limit of ${MAX_BATCH_SIZE} products`)
    }

    // Validate each product
    const validProducts: any[] = []
    const errors: string[] = []
    
    console.log('Starting validation of', products.length, 'products')
    
    products.forEach((product, index) => {
      const validationErrors = validateProductForAPI(product)
      if (validationErrors.length > 0) {
        console.log(`Product ${index + 1} validation failed:`, validationErrors, 'Product data:', product)
        errors.push(...validationErrors.map(err => `Product ${index + 1}: ${err}`))
      } else {
        validProducts.push(product)
      }
    })
    
    console.log(`Validation complete: ${validProducts.length} valid, ${errors.length} failed`)

    if (errors.length > 0 && validProducts.length === 0) {
      return createResponse(
        false,
        null,
        `Validation failed for all products: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`,
        null,
        { 
          total: products.length,
          created: 0,
          failed: errors.length,
          errors
        }
      )
    }

    // Get current user for audit fields
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { user: user?.id, authError })
    
    if (!user) {
      return createResponse(false, null, 'User not authenticated. Please log in and try again.')
    }

    // Add audit fields to each product
    const productsWithAudit = validProducts.map(product => ({
      ...product,
      created_by: user.id,
      updated_by: user.id
    }))
    
    console.log('Products with audit fields:', {
      count: productsWithAudit.length,
      sample: productsWithAudit[0]
    })

    // Process in optimal chunks for better performance
    const chunks = chunkArray(productsWithAudit, OPTIMAL_CHUNK_SIZE)
    const totalChunks = chunks.length
    let processedCount = 0
    let allInsertedData: Product[] = []
    
    console.log(`Processing ${productsWithAudit.length} products in ${totalChunks} chunks of ${OPTIMAL_CHUNK_SIZE}`)

    // Process each chunk sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      
      console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} products)`)
      
      // Report progress
      if (onProgress) {
        onProgress(chunkIndex, totalChunks, processedCount)
      }
      
      // Insert chunk with upsert strategy
      const { data: chunkData, error: chunkError } = await supabase
        .from('products')
        .upsert(chunk, { 
          onConflict: 'product_id',
          ignoreDuplicates: false 
        })
        .select()
      
      if (chunkError) {
        console.error(`Chunk ${chunkIndex + 1} failed:`, chunkError)
        return createResponse(
          false,
          null,
          `Batch insert failed at chunk ${chunkIndex + 1}: ${chunkError.message}`,
          null,
          { 
            total: products.length,
            created: processedCount,
            failed: products.length - processedCount,
            errors: [...errors, chunkError.message]
          }
        )
      }
      
      allInsertedData.push(...(chunkData || []))
      processedCount += chunk.length
      
      console.log(`Chunk ${chunkIndex + 1} completed: ${chunk.length} products inserted`)
      
      // Small delay between chunks to prevent overwhelming the database
      if (chunkIndex < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Final progress report
    if (onProgress) {
      onProgress(totalChunks, totalChunks, processedCount)
    }
    
    console.log('Insert complete:', { inserted: allInsertedData.length, failed: errors.length })

    return createResponse(
      true,
      allInsertedData,
      null,
      null,
      {
        total: products.length,
        created: allInsertedData.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    )
  } catch (error: any) {
    console.error('Exception in batchCreateProducts:', error)
    return createResponse(false, null, error.message || 'Failed to create products')
  }
}

/**
 * Helper function to split array into chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Get product statistics for dashboard
 */
export async function getProductStatistics(): Promise<APIResponse<{
  totalProducts: number
  totalBrands: number
  totalCategories: number
  averagePrice: number
  recentProducts: number
}>> {
  try {
    const supabase = createClient()
    
    // Get total count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Get distinct brands count
    const { data: brandsData } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)

    const totalBrands = new Set(brandsData?.map(item => item.brand)).size

    // Get distinct categories count
    const { data: categoriesData } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    const totalCategories = new Set(categoriesData?.map(item => item.category)).size

    // Get average price
    const { data: priceData } = await supabase
      .from('products')
      .select('dealer_price')
      .not('dealer_price', 'is', null)

    const prices = priceData?.map(item => item.dealer_price).filter(Boolean) || []
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0

    // Get recent products (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const stats = {
      totalProducts: totalProducts || 0,
      totalBrands,
      totalCategories,
      averagePrice: Math.round(averagePrice * 100) / 100,
      recentProducts: recentProducts || 0
    }

    return createResponse(true, stats)
  } catch (error) {
    console.error('Get product statistics error:', error)
    return createResponse(false, null, error instanceof Error ? error.message : 'Failed to get product statistics')
  }
}