/**
 * Import Logger
 * Tracks CSV import attempts, results, and errors for debugging
 */

interface ImportLog {
  id: string
  timestamp: string
  fileName: string
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: string[]
  warnings: string[]
  csvHeaders: string[]
  sampleData?: any
  processingTime: number
  customerType?: string
  status: 'success' | 'partial' | 'failed'
}

const MAX_LOGS = 5

export class ImportLogger {
  private static logs: ImportLog[] = []

  static startImport(fileName: string, headers: string[], sampleRow?: any): string {
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🚀 Starting CSV Import:', {
      importId,
      fileName,
      headers,
      sampleRow
    })
    
    return importId
  }

  static logImportResult(
    importId: string,
    fileName: string,
    result: {
      totalRows: number
      successfulRows: number
      failedRows: number
      errors: string[]
      warnings: string[]
      csvHeaders: string[]
      processingTime: number
      customerType?: string
      sampleData?: any
    }
  ) {
    const log: ImportLog = {
      id: importId,
      timestamp: new Date().toISOString(),
      fileName,
      totalRows: result.totalRows,
      successfulRows: result.successfulRows,
      failedRows: result.failedRows,
      errors: result.errors,
      warnings: result.warnings,
      csvHeaders: result.csvHeaders,
      sampleData: result.sampleData,
      processingTime: result.processingTime,
      customerType: result.customerType,
      status: result.failedRows === 0 ? 'success' : 
              result.successfulRows > 0 ? 'partial' : 'failed'
    }

    // Add to logs array
    this.logs.unshift(log)

    // Keep only last 5 logs
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }

    // Log detailed results
    console.log('📊 Import Complete:', {
      importId,
      status: log.status,
      successRate: `${result.successfulRows}/${result.totalRows}`,
      errors: result.errors,
      warnings: result.warnings,
      headers: result.csvHeaders,
      sampleData: result.sampleData
    })

    // Store in localStorage for persistence
    try {
      localStorage.setItem('csv_import_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.warn('Failed to save import logs to localStorage:', error)
    }

    return log
  }

  static getAllLogs(): ImportLog[] {
    // Load from localStorage if empty
    if (this.logs.length === 0) {
      try {
        const saved = localStorage.getItem('csv_import_logs')
        if (saved) {
          this.logs = JSON.parse(saved)
        }
      } catch (error) {
        console.warn('Failed to load import logs from localStorage:', error)
      }
    }
    
    return this.logs
  }

  static getLatestLog(): ImportLog | null {
    const logs = this.getAllLogs()
    return logs.length > 0 ? logs[0] : null
  }

  static logError(importId: string, error: string, context?: any) {
    console.error(`❌ Import Error [${importId}]:`, error, context)
  }

  static logWarning(importId: string, warning: string, context?: any) {
    console.warn(`⚠️ Import Warning [${importId}]:`, warning, context)
  }

  static logDataMapping(importId: string, originalHeaders: string[], mappedData: any) {
    console.log(`🗺️ Data Mapping [${importId}]:`, {
      originalHeaders,
      mappedFields: Object.keys(mappedData),
      mappedData: mappedData
    })
  }

  static clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem('csv_import_logs')
    } catch (error) {
      console.warn('Failed to clear import logs from localStorage:', error)
    }
    console.log('🗑️ Import logs cleared')
  }
}

export default ImportLogger