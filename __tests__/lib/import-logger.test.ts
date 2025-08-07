/**
 * Import Logger Tests
 * Testing our enhanced logging system with 10-log retention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import ImportLogger from '../../src/lib/import-logger'

describe('Import Logger', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.clear()
  })

  describe('startImport', () => {
    it('should create a new import log with unique ID', () => {
      const filename = 'test-products.csv'
      const headers = ['Product ID', 'Brand', 'Category']
      const sampleRow = ['PROD001', 'TestBrand', 'Audio']

      const importId = ImportLogger.startImport(filename, headers, sampleRow)

      expect(importId).toBeDefined()
      expect(typeof importId).toBe('string')
      expect(importId.length).toBeGreaterThan(0)
    })

    it('should store initial import data', () => {
      const filename = 'test-products.csv'
      const headers = ['Product ID', 'Brand', 'Category']
      const sampleRow = ['PROD001', 'TestBrand', 'Audio']

      const importId = ImportLogger.startImport(filename, headers, sampleRow)
      const logs = ImportLogger.getAllLogs()

      expect(logs).toHaveLength(1)
      expect(logs[0].importId).toBe(importId)
      expect(logs[0].filename).toBe(filename)
      expect(logs[0].csvHeaders).toEqual(headers)
      expect(logs[0].sampleRow).toEqual(sampleRow)
    })
  })

  describe('logDataMapping', () => {
    it('should log column mapping information', () => {
      const importId = ImportLogger.startImport('test.csv', ['SKU'], ['PROD001'])
      
      const mappingInfo = {
        customMapping: { 'SKU': 'product_id' },
        totalRows: 100,
        mappingResolved: true
      }

      ImportLogger.logDataMapping(importId, ['SKU'], mappingInfo)

      const logs = ImportLogger.getAllLogs()
      expect(logs[0].mappingInfo).toEqual(mappingInfo)
    })

    it('should handle mapping issues', () => {
      const importId = ImportLogger.startImport('test.csv', ['Unknown'], ['DATA'])
      
      const mappingInfo = {
        mappingIssues: {
          isValid: false,
          missingRequired: ['Product ID'],
          unrecognizedHeaders: ['Unknown'],
          suggestedMappings: {}
        },
        requiresManualMapping: true
      }

      ImportLogger.logDataMapping(importId, ['Unknown'], mappingInfo)

      const logs = ImportLogger.getAllLogs()
      expect(logs[0].mappingInfo?.requiresManualMapping).toBe(true)
      expect(logs[0].mappingInfo?.mappingIssues?.missingRequired).toContain('Product ID')
    })
  })

  describe('logImportResult', () => {
    it('should log successful import results', () => {
      const importId = ImportLogger.startImport('test.csv', ['Product ID'], ['PROD001'])
      
      const results = {
        totalRows: 100,
        successfulRows: 95,
        failedRows: 5,
        errors: ['Row 10: Invalid price'],
        warnings: ['Row 20: Missing description'],
        csvHeaders: ['Product ID', 'Brand'],
        processingTime: 1500,
        sampleData: { product_id: 'PROD001', brand: 'TestBrand' }
      }

      ImportLogger.logImportResult(importId, 'test.csv', results)

      const logs = ImportLogger.getAllLogs()
      expect(logs[0].totalRows).toBe(100)
      expect(logs[0].successfulRows).toBe(95)
      expect(logs[0].failedRows).toBe(5)
      expect(logs[0].processingTime).toBe(1500)
      expect(logs[0].status).toBe('partial') // Mixed success/failure
    })

    it('should determine status correctly', () => {
      const importId = ImportLogger.startImport('test.csv', ['Product ID'], ['PROD001'])
      
      // Test successful import
      ImportLogger.logImportResult(importId, 'test.csv', {
        totalRows: 100,
        successfulRows: 100,
        failedRows: 0,
        errors: [],
        warnings: [],
        csvHeaders: ['Product ID'],
        processingTime: 1000,
        sampleData: {}
      })

      let logs = ImportLogger.getAllLogs()
      expect(logs[0].status).toBe('success')

      // Test failed import
      const importId2 = ImportLogger.startImport('test2.csv', ['Product ID'], ['PROD002'])
      ImportLogger.logImportResult(importId2, 'test2.csv', {
        totalRows: 100,
        successfulRows: 0,
        failedRows: 100,
        errors: ['All rows failed'],
        warnings: [],
        csvHeaders: ['Product ID'],
        processingTime: 500,
        sampleData: {}
      })

      logs = ImportLogger.getAllLogs()
      expect(logs[0].status).toBe('failed')
    })
  })

  describe('Log Retention (10 logs)', () => {
    it('should keep only the last 10 logs', () => {
      // Create 15 import logs
      for (let i = 1; i <= 15; i++) {
        const importId = ImportLogger.startImport(
          `test-${i}.csv`,
          ['Product ID'],
          [`PROD${i.toString().padStart(3, '0')}`]
        )
        
        ImportLogger.logImportResult(importId, `test-${i}.csv`, {
          totalRows: 10,
          successfulRows: 10,
          failedRows: 0,
          errors: [],
          warnings: [],
          csvHeaders: ['Product ID'],
          processingTime: 100,
          sampleData: {}
        })
      }

      const logs = ImportLogger.getAllLogs()
      
      // Should only keep last 10
      expect(logs).toHaveLength(10)
      
      // Should be the most recent ones (6-15)
      expect(logs[0].filename).toBe('test-15.csv') // Most recent first
      expect(logs[9].filename).toBe('test-6.csv')  // Oldest kept
    })
  })

  describe('getAllLogs', () => {
    it('should return empty array when no logs exist', () => {
      const logs = ImportLogger.getAllLogs()
      expect(logs).toEqual([])
    })

    it('should return logs in reverse chronological order', () => {
      const importId1 = ImportLogger.startImport('first.csv', ['Product ID'], ['PROD001'])
      const importId2 = ImportLogger.startImport('second.csv', ['Product ID'], ['PROD002'])
      const importId3 = ImportLogger.startImport('third.csv', ['Product ID'], ['PROD003'])

      const logs = ImportLogger.getAllLogs()
      
      expect(logs).toHaveLength(3)
      expect(logs[0].filename).toBe('third.csv')  // Most recent first
      expect(logs[1].filename).toBe('second.csv')
      expect(logs[2].filename).toBe('first.csv')  // Oldest last
    })
  })

  describe('getLastImportId', () => {
    it('should return null when no imports exist', () => {
      const lastId = ImportLogger.getLastImportId()
      expect(lastId).toBeNull()
    })

    it('should return the ID of the most recent import', () => {
      const importId1 = ImportLogger.startImport('first.csv', ['Product ID'], ['PROD001'])
      const importId2 = ImportLogger.startImport('second.csv', ['Product ID'], ['PROD002'])

      const lastId = ImportLogger.getLastImportId()
      expect(lastId).toBe(importId2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed localStorage data gracefully', () => {
      // Manually corrupt localStorage
      localStorage.setItem('csv_import_logs', 'invalid json')

      // Should not throw and should return empty array
      const logs = ImportLogger.getAllLogs()
      expect(logs).toEqual([])
    })

    it('should handle missing required fields gracefully', () => {
      const importId = ImportLogger.startImport('test.csv', [], [])

      // Should not throw
      ImportLogger.logImportResult(importId, 'test.csv', {
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
        errors: [],
        warnings: [],
        csvHeaders: [],
        processingTime: 0,
        sampleData: null
      })

      const logs = ImportLogger.getAllLogs()
      expect(logs).toHaveLength(1)
    })

    it('should handle very large error arrays', () => {
      const importId = ImportLogger.startImport('test.csv', ['Product ID'], ['PROD001'])
      
      const largeErrorArray = Array.from({ length: 1000 }, (_, i) => `Error ${i + 1}`)
      
      ImportLogger.logImportResult(importId, 'test.csv', {
        totalRows: 1000,
        successfulRows: 0,
        failedRows: 1000,
        errors: largeErrorArray,
        warnings: [],
        csvHeaders: ['Product ID'],
        processingTime: 5000,
        sampleData: {}
      })

      const logs = ImportLogger.getAllLogs()
      expect(logs[0].errors).toHaveLength(1000)
    })

    it('should handle Unicode characters in filenames and data', () => {
      const unicodeFilename = 'test-файл-🎵.csv'
      const unicodeData = ['PROD001', 'Brand with émojis 🎵', 'Catégorie spéciale']
      
      const importId = ImportLogger.startImport(unicodeFilename, ['Product ID', 'Brand', 'Category'], unicodeData)

      const logs = ImportLogger.getAllLogs()
      expect(logs[0].filename).toBe(unicodeFilename)
      expect(logs[0].sampleRow).toEqual(unicodeData)
    })
  })
})