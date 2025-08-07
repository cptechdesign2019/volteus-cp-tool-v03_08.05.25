'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, X, Package, Layers, Building } from 'lucide-react'
import { ProductImportPreview } from './product-import-preview'
import { batchCreateProducts } from '@/lib/api/products'
import ImportLogger from '@/lib/import-logger'
import Papa from 'papaparse'

interface ProductCSVImportProps {
  onImportSuccess?: (result: any) => void
  onImportError?: (error: string) => void
  onClose?: () => void
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete' | 'error'

interface ImportProgress {
  stage: string
  processed: number
  total: number
  errors: number
  currentBatch?: number
  totalBatches?: number
}

interface ParsedProduct {
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
}

export function ProductCSVImport({ 
  onImportSuccess, 
  onImportError,
  onClose 
}: ProductCSVImportProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<any>(null)
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

  const parseProductCSV = (csvText: string) => {
    try {
      // Use Papa Parse for robust CSV parsing
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim()
      })

      if (parseResult.errors.length > 0) {
        console.warn('Papa Parse warnings:', parseResult.errors)
      }

      const rawData = parseResult.data as any[]
      const headers = Object.keys(rawData[0] || {})
      
      if (rawData.length === 0) {
        throw new Error('CSV file contains no data rows')
      }

      const products: ParsedProduct[] = []
      const errors: string[] = []
      const warnings: string[] = []

      // Create column mapping
      const columnMapping: { [key: string]: string } = {}
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_')
        
        // Map CSV headers to database fields
        switch (normalizedHeader) {
          case 'product_id': columnMapping[header] = 'product_id'; break
          case 'brand': columnMapping[header] = 'brand'; break
          case 'category': columnMapping[header] = 'category'; break
          case 'product_name': columnMapping[header] = 'product_name'; break
          case 'product_number': columnMapping[header] = 'product_number'; break
          case 'description': columnMapping[header] = 'description'; break
          case 'dealer': 
          case 'dealer_price': columnMapping[header] = 'dealer_price'; break
          case 'msrp': columnMapping[header] = 'msrp'; break
          case 'map': 
          case 'map_price': columnMapping[header] = 'map_price'; break
          case 'primary_distributor': columnMapping[header] = 'primary_distributor'; break
          case 'secondary_distributor': columnMapping[header] = 'secondary_distributor'; break
          case 'tertiary_distributor': columnMapping[header] = 'tertiary_distributor'; break
          case 'spec_sheet_url': columnMapping[header] = 'spec_sheet_url'; break
          case 'image_url': columnMapping[header] = 'image_url'; break
        }
      })

      // Process each row
      rawData.forEach((row, index) => {
        const rowNumber = index + 2 // +2 because index starts at 0 and we skip header
        const product: any = {}

        // Map row data using column mapping
        Object.entries(row).forEach(([csvColumn, value]) => {
          const dbField = columnMapping[csvColumn]
          if (dbField && value && value.toString().trim() !== '') {
            if (dbField.includes('price') || dbField === 'msrp') {
              // Parse price fields as numbers
              const cleanValue = value.toString().replace(/[$,]/g, '')
              const numValue = parseFloat(cleanValue)
              if (!isNaN(numValue)) {
                product[dbField] = numValue
              }
            } else {
              product[dbField] = value.toString().trim()
            }
          }
        })

        // Validate required fields
        const missingFields = []
        if (!product.product_id) missingFields.push('Product ID')
        if (!product.brand) missingFields.push('Brand')
        if (!product.category) missingFields.push('Category')
        if (!product.product_name) missingFields.push('Product Name')

        if (missingFields.length > 0) {
          errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`)
          return
        }

        // Additional validation
        if (product.product_id && products.some(p => p.product_id === product.product_id)) {
          errors.push(`Row ${rowNumber}: Duplicate Product ID: ${product.product_id}`)
          return
        }

        products.push(product as ParsedProduct)
      })

      return {
        success: true,
        data: products,
        headers,
        summary: {
          totalRows: products.length,
          uniqueBrands: [...new Set(products.map(p => p.brand))].length,
          uniqueCategories: [...new Set(products.map(p => p.category))].length,
          withPricing: products.filter(p => (p as any).dealer_price != null || (p as any).msrp != null || (p as any).map_price != null).length,
          withImages: products.filter(p => (p as any).image_url).length,
          withSpecs: products.filter(p => (p as any).spec_sheet_url).length
        },
        errors,
        warnings
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV',
        data: [],
        headers: [],
        summary: null,
        errors: [],
        warnings: []
      }
    }
  }

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
      const result = parseProductCSV(text)
      const processingTime = Date.now() - startTime
      
      console.log('Parse result:', result)
      
      // Log detailed parsing results
      ImportLogger.logDataMapping(importId, headers, {
        totalRows: result.data?.length || 0,
        errors: result.errors,
        warnings: result.warnings,
        sampleProcessedData: result.data?.[0] || null,
        productType: 'products'
      })
      
      if (!result.success) {
        // Log failed parsing
        ImportLogger.logImportResult(importId, file.name, {
          totalRows: 0,
          successfulRows: 0,
          failedRows: 0,
          errors: [result.error || 'Parse failed'],
          warnings: result.warnings || [],
          csvHeaders: headers,
          processingTime,
          sampleData: { headers, sampleRow }
        })
        
        setError(result.error || 'Failed to parse CSV file')
        setStep('error')
        if (onImportError) onImportError(result.error || 'Parse failed')
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

  const handleImport = async () => {
    if (!parseResult?.data) return

    try {
      setStep('processing')
      const importStart = Date.now()
      setImportProgress({
        stage: 'Preparing import...',
        processed: 0,
        total: parseResult.data.length,
        errors: 0
      })

      const BATCH_SIZE = 50
      const batches = []
      for (let i = 0; i < parseResult.data.length; i += BATCH_SIZE) {
        batches.push(parseResult.data.slice(i, i + BATCH_SIZE))
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      }

      // Process batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        setImportProgress({
          stage: `Processing batch ${batchIndex + 1} of ${batches.length}...`,
          processed: batchIndex * BATCH_SIZE,
          total: parseResult.data.length,
          errors: results.failed,
          currentBatch: batchIndex + 1,
          totalBatches: batches.length
        })

        try {
          const batchResult = await batchCreateProducts(batch)
          
          if (batchResult.success) {
            results.successful += batchResult.data?.length || 0
          } else {
            results.failed += batch.length
            results.errors.push(`Batch ${batchIndex + 1}: ${batchResult.error}`)
          }
        } catch (batchError) {
          results.failed += batch.length
          results.errors.push(`Batch ${batchIndex + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setImportProgress({
        stage: 'Import complete!',
        processed: parseResult.data.length,
        total: parseResult.data.length,
        errors: results.failed
      })

      setImportResult(results)
      setStep('complete')

      // Log final results
      if (currentImportId) {
        ImportLogger.logImportResult(currentImportId, file?.name || '', {
          totalRows: parseResult.data.length,
          successfulRows: results.successful,
          failedRows: results.failed,
          errors: results.errors,
          warnings: [],
          csvHeaders: parseResult.headers || [],
          processingTime: Date.now() - importStart,
          sampleData: parseResult.data?.[0] || null
        })
      }

      if (onImportSuccess) {
        onImportSuccess({
          total: parseResult.data.length,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors
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
    setError(null)
    setImportProgress(null)
    setImportResult(null)
  }

  // Render different steps
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Product CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the CSV file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop a CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>
              )}
            </div>

            {/* CSV Format Guide */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Expected CSV Format:</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Required columns:</strong> Product ID, Brand, Category, Product Name</p>
                <p><strong>Optional columns:</strong> Product Number, Description, Dealer Price, MSRP, MAP Price, Primary Distributor, Spec Sheet URL, Image URL</p>
                <p className="mt-3 text-blue-600">
                  📁 <strong>Ready to test?</strong> Use the <code>master-price-sheet-2025.csv</code> file in your data/ folder with 588 AV products!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'preview' && parseResult) {
    return (
      <div className="space-y-6">
        <ProductImportPreview 
          data={parseResult}
          onImport={handleImport}
          onCancel={resetImport}
        />
      </div>
    )
  }

  if (step === 'processing' && importProgress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 animate-spin" />
            Importing Products...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{importProgress.stage}</span>
              <span>{importProgress.processed} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
              />
            </div>
          </div>

          {importProgress.currentBatch && (
            <div className="text-sm text-gray-600">
              Batch {importProgress.currentBatch} of {importProgress.totalBatches}
            </div>
          )}

          {importProgress.errors > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {importProgress.errors} products failed to import
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete' && importResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Import Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importResult.successful + importResult.failed}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Import Errors:</div>
                  {importResult.errors.slice(0, 5).map((errorMessage: string, index: number) => (
                    <div key={index} className="text-sm">{errorMessage}</div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <div className="text-sm text-gray-500">
                      ... and {importResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={resetImport} variant="outline">
              Import Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Import Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={resetImport} className="flex-1">
              Try Again
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}