/**
 * Import Logger
 * Tracks CSV import attempts, results, and errors for debugging
 */

interface ImportLog {
  id: string
  importId?: string
  timestamp: string
  filename: string
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
  mappingInfo?: any
}

const MAX_LOGS = 10

export class ImportLogger {
  private static logs: ImportLog[] = []
  private static lastImportId: string | null = null

  static startImport(fileName: string, headers: string[], sampleRow?: any): string {
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🚀 Starting CSV Import:', {
      importId,
      fileName,
      headers,
      sampleRow
    })
    
    this.lastImportId = importId

    // Create a provisional log entry immediately so UI/tests can reference it
    const provisionalLog: ImportLog = {
      id: importId,
      importId,
      timestamp: new Date().toISOString(),
      filename: fileName,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      warnings: [],
      csvHeaders: headers || [],
      sampleData: sampleRow,
      processingTime: 0,
      customerType: undefined,
      status: 'partial'
    }
    // Prepend and trim to MAX_LOGS
    this.logs.unshift(provisionalLog)
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }
    // Persist
    try {
      localStorage.setItem('csv_import_logs', JSON.stringify(this.logs))
    } catch {}

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
      importId,
      timestamp: new Date().toISOString(),
      filename: fileName,
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

    // Keep only last 10 logs
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

  /**
   * Returns the most recently started import id if available
   */
  static getLatestImportId(): string | null {
    return this.lastImportId
  }

  // Backward-compat alias used in some tests
  static getLastImportId(): string | null {
    return this.getLatestImportId()
  }

  static getAllLogs(): ImportLog[] {
    // Always hydrate from localStorage to ensure consistency between sessions/tests
    try {
      const saved = localStorage.getItem('csv_import_logs')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure parsed value is an array of logs
        this.logs = Array.isArray(parsed) ? parsed : []
      } // if nothing saved, keep current in-memory state
    } catch (error) {
      console.warn('Failed to load import logs from localStorage:', error)
      // On malformed data, reset logs
      this.logs = []
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

    // Attach mapping info to the corresponding log entry and persist
    const index = this.logs.findIndex(l => l.id === importId)
    if (index !== -1) {
      this.logs[index] = { ...this.logs[index], mappingInfo: mappedData }
      try {
        localStorage.setItem('csv_import_logs', JSON.stringify(this.logs))
      } catch {}
    }
  }

  static clearLogs() {
    this.logs = []
    this.lastImportId = null
    try {
      localStorage.removeItem('csv_import_logs')
    } catch (error) {
      console.warn('Failed to clear import logs from localStorage:', error)
    }
    console.log('🗑️ Import logs cleared')
  }
}

export default ImportLogger