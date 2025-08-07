/**
 * Enhanced Product CSV Parser Tests
 * Testing our new smart column mapping and enhanced validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { parseProductCSV, validateColumnMapping, type ParseResult, type ColumnMappingResult } from '../../src/lib/product-csv-parser'

// Mock CSV data fixtures
const validCSVContent = `Product ID,Brand,Category,Product Name,Product Number,Description,Dealer,MSRP,MAP,Primary Distributor,Secondary Distributor,Tertiary Distributor,Spec Sheet URL,Image URL
PROD10001,TestBrand,Audio Equipment,Test Speaker,TS-100,High quality test speaker,99.99,199.99,149.99,TestDist,TestDist2,TestDist3,https://example.com/spec.pdf,https://example.com/image.jpg
PROD10002,AnotherBrand,Video Equipment,Test Camera,TC-200,Professional camera system,299.99,599.99,449.99,VideoDist,,,,
PROD10003,TestBrand,Lighting,LED Panel,LP-300,Bright LED lighting panel,149.99,299.99,224.99,LightDist,,,https://example.com/spec2.pdf,`

const mismatchedColumnCSV = `SKU,Manufacturer,Type,Name,Model,Details,Cost,Retail,Floor,Dist1,Dist2,Dist3,Spec,Photo
PROD10001,TestBrand,Audio Equipment,Test Speaker,TS-100,High quality test speaker,99.99,199.99,149.99,TestDist,TestDist2,TestDist3,https://example.com/spec.pdf,https://example.com/image.jpg`

const missingRequiredColumnsCSV = `Product ID,Brand,Category
PROD10001,TestBrand,Audio Equipment`

const invalidDataTypesCSV = `Product ID,Brand,Category,Product Name,Product Number,Description,Dealer,MSRP,MAP,Primary Distributor,Secondary Distributor,Tertiary Distributor,Spec Sheet URL,Image URL
PROD10001,TestBrand,Audio Equipment,Test Speaker,TS-100,High quality test speaker,invalid_price,not_a_number,149.99,TestDist,,,https://invalid-url,https://example.com/image.jpg`

const duplicateProductIDCSV = `Product ID,Brand,Category,Product Name,Product Number,Description,Dealer,MSRP,MAP,Primary Distributor,Secondary Distributor,Tertiary Distributor,Spec Sheet URL,Image URL
PROD10001,TestBrand,Audio Equipment,Test Speaker,TS-100,High quality test speaker,99.99,199.99,149.99,TestDist,,,https://example.com/spec.pdf,https://example.com/image.jpg
PROD10001,AnotherBrand,Video Equipment,Different Product,DP-200,Different description,199.99,399.99,299.99,VideoDist,,,https://example.com/spec2.pdf,https://example.com/image2.jpg`

const priceFormatsCSV = `Product ID,Brand,Category,Product Name,Dealer,MSRP,MAP
PROD10001,TestBrand,Audio Equipment,Test Speaker,$99.99,$199.99,$149.99
PROD10002,TestBrand,Audio Equipment,Test Speaker 2,"1,234.56","2,468.99","1,850.00"
PROD10003,TestBrand,Audio Equipment,Test Speaker 3,N/A,TBD,Call
PROD10004,TestBrand,Audio Equipment,Test Speaker 4,,,`

describe('Enhanced Product CSV Parser', () => {
  describe('parseProductCSV', () => {
    it('should parse valid CSV content successfully', () => {
      const result = parseProductCSV(validCSVContent)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.errors).toHaveLength(0)

      // Check first product
      expect(result.data[0]).toEqual({
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
      })
    })

    it('should handle empty optional fields correctly', () => {
      const result = parseProductCSV(validCSVContent)

      expect(result.success).toBe(true)
      
      // Check third product with empty fields
      expect(result.data[2].secondary_distributor).toBe('')
      expect(result.data[2].tertiary_distributor).toBe('')
      expect(result.data[2].image_url).toBe(null) // URLs should be null when empty
    })

    it('should handle various price formats', () => {
      const result = parseProductCSV(priceFormatsCSV)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(4)

      // Dollar signs and commas should be stripped
      expect(result.data[0].dealer_price).toBe(99.99)
      expect(result.data[1].dealer_price).toBe(1234.56)

      // Text values should become null
      expect(result.data[2].dealer_price).toBe(null)
      expect(result.data[2].msrp).toBe(null)

      // Empty values should become null
      expect(result.data[3].dealer_price).toBe(null)
    })

    it('should detect duplicate Product IDs within import', () => {
      const result = parseProductCSV(duplicateProductIDCSV)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('Duplicate Product ID'))).toBe(true)
    })

    it('should handle empty CSV content', () => {
      const result = parseProductCSV('')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('CSV file is empty')
    })

    it('should handle CSV with only headers', () => {
      const headerOnlyCSV = 'Product ID,Brand,Category,Product Name'
      const result = parseProductCSV(headerOnlyCSV)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('CSV file contains no data rows')
    })

    it('should handle BOM characters', () => {
      const csvWithBOM = '\uFEFF' + validCSVContent
      const result = parseProductCSV(csvWithBOM)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
    })

    it('should generate summary statistics', () => {
      const result = parseProductCSV(validCSVContent)

      expect(result.success).toBe(true)
      expect(result.summary).toBeDefined()
      expect(result.summary!.totalProducts).toBe(3)
      expect(result.summary!.uniqueBrands).toBe(2) // TestBrand, AnotherBrand
      expect(result.summary!.uniqueCategories).toBe(3) // Audio, Video, Lighting
      expect(result.summary!.productsWithPricing).toBe(3)
      expect(result.summary!.productsWithImages).toBe(1)
      expect(result.summary!.productsWithSpecs).toBe(2)
    })
  })

  describe('validateColumnMapping', () => {
    it('should validate correct column headers', () => {
      const headers = ['Product ID', 'Brand', 'Category', 'Product Name', 'Dealer', 'MSRP']
      const result = validateColumnMapping(headers)

      expect(result.isValid).toBe(true)
      expect(result.missingRequired).toHaveLength(0)
    })

    it('should detect missing required columns', () => {
      const headers = ['Product ID', 'Brand', 'Category'] // Missing Product Name
      const result = validateColumnMapping(headers)

      expect(result.isValid).toBe(false)
      expect(result.missingRequired).toContain('Product Name')
    })

    it('should suggest smart column mappings', () => {
      const headers = ['SKU', 'Manufacturer', 'Type', 'Name'] // Common alternatives
      const result = validateColumnMapping(headers)

      expect(result.isValid).toBe(false)
      expect(result.suggestedMappings).toBeDefined()
      
      // Should suggest SKU -> Product ID
      expect(result.suggestedMappings['Product ID']).toContain('SKU')
      // Should suggest Manufacturer -> Brand
      expect(result.suggestedMappings['Brand']).toContain('Manufacturer')
    })

    it('should identify unrecognized headers', () => {
      const headers = ['Product ID', 'Brand', 'Category', 'Product Name', 'Unknown Column', 'Another Unknown']
      const result = validateColumnMapping(headers)

      expect(result.isValid).toBe(true) // Still valid because required columns present
      expect(result.unrecognizedHeaders).toContain('Unknown Column')
      expect(result.unrecognizedHeaders).toContain('Another Unknown')
    })
  })

  describe('Custom Column Mapping', () => {
    it('should parse CSV with custom column mapping', () => {
      const customMapping = {
        'SKU': 'product_id',
        'Manufacturer': 'brand',
        'Type': 'category',
        'Name': 'product_name'
      }

      const result = parseProductCSV(mismatchedColumnCSV, customMapping)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].product_id).toBe('PROD10001')
      expect(result.data[0].brand).toBe('TestBrand')
    })
  })

  describe('Data Validation', () => {
    it('should validate field length constraints', () => {
      const longFieldCSV = `Product ID,Brand,Category,Product Name
${'A'.repeat(51)},TestBrand,Audio Equipment,Test Speaker`

      const result = parseProductCSV(longFieldCSV)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('Product ID') && error.includes('50 characters'))).toBe(true)
    })

    it('should validate URL formats', () => {
      const result = parseProductCSV(invalidDataTypesCSV)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('valid URL'))).toBe(true)
    })

    it('should validate price formats', () => {
      const result = parseProductCSV(invalidDataTypesCSV)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('positive number'))).toBe(true)
    })

    it('should require all mandatory fields', () => {
      const incompleteCSV = `Product ID,Brand,Category,Product Name
PROD10001,,Audio Equipment,Test Speaker`

      const result = parseProductCSV(incompleteCSV)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('Brand is required'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in CSV data', () => {
      const specialCharCSV = `Product ID,Brand,Category,Product Name,Description
PROD10001,"Brand with ""quotes""","Category with & symbol","Product with, commas","Description with newline\nand tabs\t"`

      const result = parseProductCSV(specialCharCSV)

      expect(result.success).toBe(true)
      expect(result.data[0].brand).toBe('Brand with "quotes"')
      expect(result.data[0].category).toBe('Category with & symbol')
      expect(result.data[0].product_name).toBe('Product with, commas')
    })

    it('should handle extremely long descriptions gracefully', () => {
      const longDescription = 'A'.repeat(2000) // Exceeds 1000 char limit
      const csvWithLongDesc = `Product ID,Brand,Category,Product Name,Description
PROD10001,TestBrand,Audio Equipment,Test Speaker,"${longDescription}"`

      const result = parseProductCSV(csvWithLongDesc)

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('Description') && error.includes('1000 characters'))).toBe(true)
    })

    it('should handle mixed line endings', () => {
      const mixedLineEndingsCSV = validCSVContent.replace(/\n/g, '\r\n')
      const result = parseProductCSV(mixedLineEndingsCSV)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
    })
  })

  describe('Performance', () => {
    it('should handle reasonably large datasets efficiently', () => {
      // Generate a moderately large CSV (100 products)
      const header = `Product ID,Brand,Category,Product Name,Dealer,MSRP,MAP\n`
      const rows = []
      for (let i = 1; i <= 100; i++) {
        rows.push(`PROD${i.toString().padStart(5, '0')},Brand${i % 10 + 1},Category${i % 5 + 1},Product ${i},${(i * 10).toFixed(2)},${(i * 20).toFixed(2)},${(i * 15).toFixed(2)}`)
      }
      const largeCsv = header + rows.join('\n')

      const startTime = Date.now()
      const result = parseProductCSV(largeCsv)
      const parseTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(100)
      expect(parseTime).toBeLessThan(2000) // Should parse within 2 seconds
    })
  })
})