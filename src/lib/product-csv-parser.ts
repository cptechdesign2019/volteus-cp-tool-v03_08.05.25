/**
 * Product CSV Parser Utility (Based on Todd's Working Implementation)
 * Handles CSV parsing, validation, and error reporting for product imports
 */

import Papa from 'papaparse'

// Required CSV columns mapping to database fields
const REQUIRED_COLUMNS = [
  'Product ID',
  'Brand', 
  'Category',
  'Product Name'
]

const COLUMN_MAPPING: { [key: string]: string } = {
  'Product ID': 'product_id',
  'Brand': 'brand',
  'Category': 'category', 
  'Product Name': 'product_name',
  'Product Number': 'product_number',
  'Description': 'description',
  'Dealer': 'dealer_price',
  'MSRP': 'msrp',
  'MAP': 'map_price',
  'Primary Distributor': 'primary_distributor',
  'Secondary Distributor': 'secondary_distributor',
  'Tertiary Distributor': 'tertiary_distributor',
  'Spec Sheet URL': 'spec_sheet_url',
  'Image URL': 'image_url'
}

// Smart column suggestions for common alternatives
const COLUMN_SUGGESTIONS: { [key: string]: string[] } = {
  'Product ID': ['SKU', 'Product Code', 'Item ID', 'Part Number', 'Model'],
  'Brand': ['Manufacturer', 'Make', 'Vendor', 'Company'],
  'Category': ['Type', 'Classification', 'Group', 'Family'],
  'Product Name': ['Name', 'Title', 'Item Name', 'Description'],
  'Dealer': ['Cost', 'Dealer Price', 'Wholesale', 'Net Price'],
  'MSRP': ['Retail', 'List Price', 'RRP', 'Suggested Price'],
  'MAP': ['MAP Price', 'Minimum Price', 'Floor Price']
}

// Field validation constraints
const FIELD_CONSTRAINTS: { [key: string]: any } = {
  product_id: { required: true, maxLength: 50 },
  brand: { required: true, maxLength: 100 },
  category: { required: true, maxLength: 100 },
  product_name: { required: true, maxLength: 255 },
  product_number: { required: false, maxLength: 100 },
  description: { required: false, maxLength: 1000 },
  dealer_price: { required: false, type: 'decimal' },
  msrp: { required: false, type: 'decimal' },
  map_price: { required: false, type: 'decimal' },
  primary_distributor: { required: false, maxLength: 100 },
  secondary_distributor: { required: false, maxLength: 100 },
  tertiary_distributor: { required: false, maxLength: 100 },
  spec_sheet_url: { required: false, type: 'url' },
  image_url: { required: false, type: 'url' }
}

export interface ParseResult {
  success: boolean
  data: any[]
  headers: string[]
  errors: string[]
  warnings: string[]
  summary?: {
    totalProducts: number
    uniqueBrands: number
    uniqueCategories: number
    productsWithPricing: number
    productsWithImages: number
    productsWithSpecs: number
  }
  columnMapping?: { [key: string]: string }
  suggestedMappings?: { [key: string]: string[] }
}

export interface ColumnMappingResult {
  isValid: boolean
  missingRequired: string[]
  unrecognizedHeaders: string[]
  suggestedMappings: { [key: string]: string[] }
}

/**
 * Check if CSV headers match expected columns and suggest fixes
 */
export function validateColumnMapping(csvHeaders: string[]): ColumnMappingResult {
  const normalizedHeaders = csvHeaders.map(h => h.trim())
  const expectedHeaders = Object.keys(COLUMN_MAPPING)
  
  const missingRequired = REQUIRED_COLUMNS.filter(
    required => !normalizedHeaders.includes(required)
  )
  
  const unrecognizedHeaders = normalizedHeaders.filter(
    header => !expectedHeaders.includes(header)
  )
  
  const suggestedMappings: { [key: string]: string[] } = {}
  
  // Generate suggestions for missing required columns
  missingRequired.forEach(missing => {
    const suggestions = COLUMN_SUGGESTIONS[missing] || []
    const matches = suggestions.filter(suggestion => 
      normalizedHeaders.some(header => 
        header.toLowerCase().includes(suggestion.toLowerCase()) ||
        suggestion.toLowerCase().includes(header.toLowerCase())
      )
    )
    if (matches.length > 0) {
      suggestedMappings[missing] = matches
    }
  })
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    unrecognizedHeaders,
    suggestedMappings
  }
}

/**
 * Parse CSV content and validate structure and data
 */
export function parseProductCSV(csvContent: string, customMapping?: { [key: string]: string }): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for empty content
  if (!csvContent || csvContent.trim() === '') {
    return {
      success: false,
      data: [],
      headers: [],
      errors: ['CSV file is empty'],
      warnings: []
    }
  }

  // Remove BOM if present
  const cleanContent = csvContent.replace(/^\uFEFF/, '')

  // Parse with Papa Parse
  const parseResult = Papa.parse(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  })

  console.log('Papa Parse result:', {
    totalRows: parseResult.data.length,
    errors: parseResult.errors.length,
    meta: parseResult.meta,
    headers: parseResult.meta.fields
  })

  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(error => {
      errors.push(`Row ${error.row + 1}: ${error.message}`)
    })
  }

  const csvHeaders = parseResult.meta.fields || []
  
  // Use custom mapping if provided, otherwise use default
  const columnMapping = customMapping || COLUMN_MAPPING
  
  // Validate column mapping
  const mappingValidation = validateColumnMapping(csvHeaders)
  if (!mappingValidation.isValid && !customMapping) {
    return {
      success: false,
      data: [],
      headers: csvHeaders,
      errors: [`Missing required columns: ${mappingValidation.missingRequired.join(', ')}`],
      warnings: [],
      suggestedMappings: mappingValidation.suggestedMappings
    }
  }

  // Check if we have data rows
  if (parseResult.data.length === 0) {
    errors.push('CSV file contains no data rows')
  }

  // If structure errors exist, return early
  if (errors.length > 0) {
    return {
      success: false,
      data: [],
      headers: csvHeaders,
      errors,
      warnings
    }
  }

  // Validate and transform data
  const validatedData: any[] = []
  const productIds = new Set<string>()
  
  console.log('Starting CSV validation of', parseResult.data.length, 'rows')
  
  parseResult.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2 // +2 because index starts at 0 and we skip header
    
    // Transform row data using column mapping
    const transformedRow = transformRowData(row, columnMapping)
    
    // Check for duplicate Product ID before validation
    if (transformedRow.product_id && productIds.has(transformedRow.product_id)) {
      errors.push(`Row ${rowNumber}: Duplicate Product ID "${transformedRow.product_id}" found in this import`)
      return
    }
    
    // Validate the transformed data
    const validation = validateProductData(transformedRow, rowNumber)
    
    if (validation.isValid) {
      validatedData.push(transformedRow)
      if (transformedRow.product_id) {
        productIds.add(transformedRow.product_id)
      }
    } else {
      console.log(`Row ${rowNumber} failed validation:`, {
        errors: validation.errors,
        data: transformedRow
      })
      errors.push(...validation.errors)
    }
  })

  console.log('CSV validation complete:', {
    total: parseResult.data.length,
    valid: validatedData.length,
    errors: errors.length
  })

  // Generate summary
  const summary = generateSummary(validatedData)

  return {
    success: errors.length === 0 || validatedData.length > 0,
    data: validatedData,
    headers: csvHeaders,
    errors,
    warnings,
    summary,
    columnMapping
  }
}

/**
 * Transform row data using column mapping
 */
function transformRowData(row: any, columnMapping: { [key: string]: string }): any {
  const transformed: any = {}
  
  Object.entries(columnMapping).forEach(([csvColumn, dbField]) => {
    const value = row[csvColumn]
    
    // Handle price fields specially
    if (dbField.includes('price') || dbField === 'msrp' || dbField === 'map_price') {
      if (value && value !== '') {
        // Clean the value: remove currency symbols, commas, spaces
        const cleanValue = value.toString().replace(/[$,\s]/g, '')
        
        // Handle common text values
        if (/^(n\/a|na|tbd|call|contact|quote)$/i.test(cleanValue)) {
          transformed[dbField] = null // Treat as null for optional pricing
        } else {
          const numValue = parseFloat(cleanValue)
          transformed[dbField] = isNaN(numValue) ? value : numValue // Keep original if invalid for validation
        }
      } else {
        transformed[dbField] = null
      }
    } else {
      // Handle empty strings consistently - convert to null for URL fields, empty string for others
      if (dbField === 'spec_sheet_url' || dbField === 'image_url') {
        if (!value || value.trim() === '' || !/^https?:\/\//i.test(value.trim())) {
          // If empty or not starting with http/https, store as null to bypass DB constraint
          transformed[dbField] = null
        } else {
          transformed[dbField] = value.trim()
        }
      } else {
        transformed[dbField] = value === '' ? '' : value
      }
    }
  })
  
  return transformed
}

/**
 * Validate individual product data
 */
function validateProductData(productData: any, rowNumber: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  Object.entries(FIELD_CONSTRAINTS).forEach(([field, constraints]) => {
    const value = productData[field]
    const fieldLabel = field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

    // Check required fields
    if (constraints.required && (!value || value === '')) {
      errors.push(`Row ${rowNumber}: ${fieldLabel} is required`)
      return
    }

    // Skip validation for null/empty optional fields
    if (!value || value === '') {
      return
    }

    // Check string length constraints
    if (constraints.maxLength && typeof value === 'string' && value.length > constraints.maxLength) {
      errors.push(`Row ${rowNumber}: ${fieldLabel} must be ${constraints.maxLength} characters or less`)
    }

    // Check data type constraints
    if (constraints.type === 'decimal') {
      // Skip validation if value is null (optional fields)
      if (value !== null) {
        if (typeof value === 'string' || (typeof value === 'number' && isNaN(value))) {
          errors.push(`Row ${rowNumber}: ${fieldLabel} must be a valid positive number or empty`)
        } else if (typeof value === 'number' && value < 0) {
          errors.push(`Row ${rowNumber}: ${fieldLabel} must be a positive number`)
        }
      }
    }

    // Basic URL validation
    if (constraints.type === 'url' && value) {
      if (typeof value === 'string' && !value.match(/^https?:\/\/.+/)) {
        errors.push(`Row ${rowNumber}: ${fieldLabel} must be a valid URL starting with http:// or https://`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate summary statistics for validated data
 */
function generateSummary(data: any[]) {
  const brands = new Set(data.map(p => p.brand).filter(Boolean))
  const categories = new Set(data.map(p => p.category).filter(Boolean))
  
  return {
    totalProducts: data.length,
    uniqueBrands: brands.size,
    uniqueCategories: categories.size,
    productsWithPricing: data.filter(p => p.dealer_price != null || p.msrp != null || p.map_price != null).length,
    productsWithImages: data.filter(p => p.image_url).length,
    productsWithSpecs: data.filter(p => p.spec_sheet_url).length
  }
}