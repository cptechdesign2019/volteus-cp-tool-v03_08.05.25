'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, FileText, AlertCircle, CheckCircle, X, Package, DollarSign, Image as ImageIcon, FileText as FileTextIcon, Loader2, Clock, Zap, Shield, MapPin } from 'lucide-react'
import { parseProductCSV, validateColumnMapping, type ParseResult, type ColumnMappingResult } from '@/lib/product-csv-parser'
import { ProductImportPreview } from './product-import-preview'
import { batchCreateProducts } from '@/lib/api/products'
import ImportLogger from '@/lib/import-logger'

interface EnhancedProductCSVImportProps {
  onImportSuccess?: (result: any) => void
  onImportError?: (error: string) => void
  onClose?: () => void
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete' | 'error'

interface ImportProgress {
  stage: string
  processed: number
  total: number
  errors: number
  currentBatch?: number
  totalBatches?: number
}

export function EnhancedProductCSVImport({ 
  onImportSuccess, 
  onImportError,
  onClose 
}: EnhancedProductCSVImportProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mappingIssues, setMappingIssues] = useState<ColumnMappingResult | null>(null)
  const [customMapping, setCustomMapping] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [currentImportId, setCurrentImportId] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setError(null)
      handleFileUpload(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleFileUpload = async (file: File) => {
    try {
      setError(null)
      
      const text = await file.text()
      
      // Extract headers from CSV for logging
      const lines = text.split('\n')
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/['"]/g, '')) : []
      const sampleRow = lines[1] ? lines[1].split(',').map(h => h.trim().replace(/['"]/g, '')) : []
      
      // Start import logging
      const importId = ImportLogger.startImport(file.name, headers, sampleRow)
      setCurrentImportId(importId)
      
      console.log('Parsing product CSV...')
      const startTime = Date.now()
      
      // First, check column mapping
      const mappingValidation = validateColumnMapping(headers)
      
      if (!mappingValidation.isValid) {
        // Show column mapping dialog
        setMappingIssues(mappingValidation)
        setStep('mapping')
        
        // Log mapping issues
        ImportLogger.logDataMapping(importId, headers, {
          mappingIssues: mappingValidation,
          requiresManualMapping: true
        })
        return
      }
      
      // Parse with default mapping
      const result = parseProductCSV(text)
      const processingTime = Date.now() - startTime
      
      console.log('Parse result:', result)
      
      // Log detailed parsing results
      ImportLogger.logDataMapping(importId, headers, {
        totalRows: result.data?.length || 0,
        errors: result.errors,
        warnings: result.warnings,
        sampleProcessedData: result.data?.[0] || null,
        processingTime
      })
      
      if (!result.success) {
        // Log failed parsing
        ImportLogger.logImportResult(importId, file.name, {
          totalRows: 0,
          successfulRows: 0,
          failedRows: 0,
          errors: [result.errors.join('; ')],
          warnings: result.warnings || [],
          csvHeaders: headers,
          processingTime,
          sampleData: { headers, sampleRow }
        })
        
        setError(result.errors.join('\n'))
        setStep('error')
        if (onImportError) onImportError(result.errors.join('\n'))
        return
      }

      if (result.errors.length > 0) {
        console.warn('Parse warnings:', result.errors)
      }

      // Attach metadata for later logging
      (result as any).importId = importId
      ;(result as any).csvHeaders = headers
      ;(result as any).processingTime = processingTime

      setParseResult(result)
      setStep('preview')
      
    } catch (error) {
      console.error('File upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file'
      setError(errorMessage)
      setStep('error')
      if (onImportError) onImportError(errorMessage)
    }
  }

  const handleMappingComplete = (mapping: { [key: string]: string }) => {
    if (!file) return
    
    // Re-parse with custom mapping
    file.text().then(text => {
      console.log('Re-parsing with custom mapping:', mapping)
      const result = parseProductCSV(text, mapping)
      
      if (result.success) {
        setParseResult(result)
        setCustomMapping(mapping)
        setStep('preview')
        
        if (currentImportId) {
          ImportLogger.logDataMapping(currentImportId, result.headers, {
            customMapping: mapping,
            totalRows: result.data?.length || 0,
            mappingResolved: true
          })
        }
      } else {
        setError(result.errors.join('\n'))
        setStep('error')
      }
    })
  }

  const handleImport = async () => {
    if (!parseResult?.data || !file) return

    try {
      setStep('processing')
      const importStart = Date.now()
      
      setImportProgress({
        stage: 'Preparing import...',
        processed: 0,
        total: parseResult.data.length,
        errors: 0
      })

      // Progress callback
      const onProgress = (chunkIndex: number, totalChunks: number, processedCount: number) => {
        setImportProgress({
          stage: `Processing batch ${chunkIndex + 1} of ${totalChunks}...`,
          processed: processedCount,
          total: parseResult.data.length,
          errors: 0,
          currentBatch: chunkIndex + 1,
          totalBatches: totalChunks
        })
      }

      const result = await batchCreateProducts(parseResult.data, onProgress)

      setImportProgress({
        stage: 'Import complete!',
        processed: parseResult.data.length,
        total: parseResult.data.length,
        errors: result.summary?.failed || 0
      })

      setImportResult(result)
      setStep('complete')

      // Log final results
      if (currentImportId) {
        ImportLogger.logImportResult(currentImportId, file.name, {
          totalRows: parseResult.data.length,
          successfulRows: result.summary?.created || 0,
          failedRows: result.summary?.failed || 0,
          errors: result.summary?.errors || [],
          warnings: [],
          csvHeaders: parseResult.headers || [],
          processingTime: Date.now() - importStart,
          sampleData: parseResult.data?.[0] || null
        })
      }

      if (onImportSuccess && result.success) {
        onImportSuccess({
          total: parseResult.data.length,
          successful: result.summary?.created || 0,
          failed: result.summary?.failed || 0,
          errors: result.summary?.errors || []
        })
      }

    } catch (error) {
      console.error('Import error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Import failed'
      setError(errorMessage)
      setStep('error')
      if (onImportError) onImportError(errorMessage)
    }
  }

  const resetImport = () => {
    setStep('upload')
    setFile(null)
    setParseResult(null)
    setMappingIssues(null)
    setCustomMapping({})
    setError(null)
    setImportProgress(null)
    setImportResult(null)
    setCurrentImportId(null)
  }

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}>
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Upload Product CSV</p>
          <p className="text-gray-600 mb-4">
            {isDragActive ? 'Drop your CSV file here' : 'Drag and drop your CSV file here, or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports CSV files up to 10MB. Expected columns: Product ID, Brand, Category, Product Name, etc.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Expected CSV Format</h4>
          <p className="text-sm text-blue-700 mb-2">Required columns:</p>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• <strong>Product ID</strong> - Unique identifier</li>
            <li>• <strong>Brand</strong> - Manufacturer name</li>
            <li>• <strong>Category</strong> - Product category</li>
            <li>• <strong>Product Name</strong> - Product title</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">Optional: Product Number, Description, Dealer, MSRP, MAP, Distributors, URLs</p>
        </div>
      </div>
    )
  }

  // Column Mapping Step
  if (step === 'mapping' && mappingIssues) {
    return (
      <ColumnMappingDialog
        mappingIssues={mappingIssues}
        csvHeaders={parseResult?.headers || []}
        onComplete={handleMappingComplete}
        onCancel={resetImport}
      />
    )
  }

  // Preview Step
  if (step === 'preview' && parseResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import Preview</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetImport}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />
              Import {parseResult.data.length} Products
            </Button>
          </div>
        </div>

        <ProductImportPreview
          data={{
            success: parseResult.success,
            data: parseResult.data,
            headers: parseResult.headers,
            summary: {
              totalRows: parseResult.data.length,
              uniqueBrands: parseResult.summary?.uniqueBrands || 0,
              uniqueCategories: parseResult.summary?.uniqueCategories || 0,
              withPricing: parseResult.summary?.productsWithPricing || 0,
              withImages: parseResult.summary?.productsWithImages || 0,
              withSpecs: parseResult.summary?.productsWithSpecs || 0
            },
            errors: parseResult.errors,
            warnings: parseResult.warnings
          }}
          onImport={handleImport}
          onCancel={resetImport}
        />
      </div>
    )
  }

  // Processing Step
  if (step === 'processing' && importProgress) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Importing Products</h3>
          <p className="text-gray-600">{importProgress.stage}</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{importProgress.processed} / {importProgress.total}</span>
            </div>
            <Progress value={(importProgress.processed / importProgress.total) * 100} />
          </div>

          {importProgress.currentBatch && (
            <div className="text-center text-sm text-gray-600">
              Batch {importProgress.currentBatch} of {importProgress.totalBatches}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Complete Step
  if (step === 'complete' && importResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
          <p className="text-gray-600">Your products have been successfully imported</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.summary?.created || 0}</div>
              <div className="text-sm text-gray-600">Imported</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{importResult.summary?.total || 0}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.summary?.failed || 0}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
        </div>

        {importResult.summary?.errors && importResult.summary.errors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Import completed with errors:</p>
              <ul className="list-disc list-inside mt-1">
                {importResult.summary.errors.slice(0, 5).map((error: string, index: number) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
                {importResult.summary.errors.length > 5 && (
                  <li className="text-sm">... and {importResult.summary.errors.length - 5} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={resetImport}>
            Import Another File
          </Button>
          {onClose && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Error Step
  if (step === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold mb-2">Import Error</h3>
          <p className="text-gray-600">There was an error processing your file</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button onClick={resetImport}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return null
}

// Column Mapping Dialog Component
interface ColumnMappingDialogProps {
  mappingIssues: ColumnMappingResult
  csvHeaders: string[]
  onComplete: (mapping: { [key: string]: string }) => void
  onCancel: () => void
}

function ColumnMappingDialog({ mappingIssues, csvHeaders, onComplete, onCancel }: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<{ [key: string]: string }>({})

  const requiredMappings = ['Product ID', 'Brand', 'Category', 'Product Name']
  const optionalMappings = ['Product Number', 'Description', 'Dealer', 'MSRP', 'MAP', 'Primary Distributor', 'Secondary Distributor', 'Tertiary Distributor', 'Spec Sheet URL', 'Image URL']

  const handleMappingChange = (expectedColumn: string, csvColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [expectedColumn]: csvColumn
    }))
  }

  const isValid = requiredMappings.every(col => mapping[col] && mapping[col] !== '')

  const handleComplete = () => {
    if (isValid) {
      onComplete(mapping)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Column Mapping Required</h3>
        <p className="text-gray-600">
          Some required columns are missing or have different names. Please map your CSV columns to the expected format:
        </p>
      </div>

      {mappingIssues.missingRequired.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Missing required columns:</p>
            <ul className="list-disc list-inside">
              {mappingIssues.missingRequired.map(col => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h4 className="font-medium">Required Mappings</h4>
        {requiredMappings.map(expectedColumn => (
          <div key={expectedColumn} className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">{expectedColumn}</div>
            <div className="text-gray-500">→</div>
            <Select
              value={mapping[expectedColumn] || ''}
              onValueChange={(value) => handleMappingChange(expectedColumn, value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select CSV column" />
              </SelectTrigger>
              <SelectContent>
                {csvHeaders.map(header => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mappingIssues.suggestedMappings[expectedColumn] && (
              <div className="text-sm text-blue-600">
                Suggested: {mappingIssues.suggestedMappings[expectedColumn].join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleComplete} disabled={!isValid}>
          Continue with Mapping
        </Button>
      </div>
    </div>
  )
}

export default EnhancedProductCSVImport