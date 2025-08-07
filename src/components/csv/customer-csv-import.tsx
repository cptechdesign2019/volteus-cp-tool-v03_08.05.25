'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, AlertTriangle, CheckCircle, X, Users, Building, Home } from 'lucide-react'
import { parseCustomerCSV } from '@/lib/customer-csv-parser'
import { CustomerImportPreview } from './customer-import-preview'
import { createCustomerAccount, createCustomerContact } from '@/lib/api/customers'
import ImportLogger from '@/lib/import-logger'

interface CustomerCSVImportProps {
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

export function CustomerCSVImport({ 
  onImportSuccess, 
  onImportError,
  onClose 
}: CustomerCSVImportProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [customerType, setCustomerType] = useState<string>('auto')
  const [parseResult, setParseResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

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
      const selectedCustomerType = customerType === 'auto' ? null : customerType
      
      // Extract headers from CSV for logging
      const lines = text.split('\n')
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/['"]/g, '')) : []
      const sampleRow = lines[1] ? lines[1].split(',').map(h => h.trim().replace(/['"]/g, '')) : []
      
      // Start import logging
      const importId = ImportLogger.startImport(file.name, headers, sampleRow)
      
      console.log('Parsing CSV with customer type:', selectedCustomerType)
      const startTime = Date.now()
      const result = parseCustomerCSV(text, selectedCustomerType || undefined) as any
      const processingTime = Date.now() - startTime
      
      console.log('Parse result:', result)
      
      // Log detailed parsing results
      ImportLogger.logDataMapping(importId, headers, {
        totalRows: result.data?.length || 0,
        errors: result.errors,
        warnings: result.warnings,
        sampleProcessedData: result.data?.[0] || null,
        customerType: selectedCustomerType || undefined
      })
      
      if (!result.success) {
        // Log failed parsing
        ImportLogger.logImportResult(importId, file.name, {
          totalRows: 0,
          successfulRows: 0,
          failedRows: 1,
          errors: result.errors || ['Failed to parse CSV'],
          warnings: result.warnings || [],
          csvHeaders: headers,
          processingTime,
          customerType: selectedCustomerType || undefined,
          sampleData: { headers, sampleRow }
        })
        
        setError(result.errors.join('\n'))
        setStep('error')
        return
      }

      // Store import ID for later use in actual import
      result.importId = importId
      result.csvHeaders = headers
      result.processingTime = processingTime

      // Prepare preview data
      const previewData = {
        preview: result.data.slice(0, 10), // First 10 rows for preview
        summary: {
          ...result.summary,
          hasMoreRows: result.data.length > 10
        }
      }

      setParseResult({ ...result, previewData })
      setStep('preview')
    } catch (error) {
      console.error('Error processing file:', error)
      setError('Error processing file. Please check the file format and try again.')
      setStep('error')
    }
  }

  const handleConfirmImport = async () => {
    if (!parseResult || !parseResult.data) return

    setStep('processing')
    setImportProgress({
      stage: 'Preparing import...',
      processed: 0,
      total: parseResult.data.length,
      errors: 0
    })

    try {
      const results = await batchImportCustomers(parseResult.data)
      
      // Log final import results
      if (parseResult.importId) {
        ImportLogger.logImportResult(parseResult.importId, file?.name || 'unknown.csv', {
          totalRows: parseResult.data.length,
          successfulRows: results.successful,
          failedRows: results.failed,
          errors: results.errors,
          warnings: parseResult.warnings || [],
          csvHeaders: parseResult.csvHeaders || [],
          processingTime: parseResult.processingTime || 0,
          customerType: customerType === 'auto' ? 'auto-detected' : customerType,
          sampleData: parseResult.data[0] || null
        })
      }
      
      setImportResult(results)
      setStep('complete')
      
      if (onImportSuccess) {
        onImportSuccess(results)
      }
    } catch (error) {
      console.error('Import failed:', error)
      
      // Log import failure
      if (parseResult.importId) {
        ImportLogger.logImportResult(parseResult.importId, file?.name || 'unknown.csv', {
          totalRows: parseResult.data.length,
          successfulRows: 0,
          failedRows: parseResult.data.length,
          errors: [error instanceof Error ? error.message : 'Import failed'],
          warnings: parseResult.warnings || [],
          csvHeaders: parseResult.csvHeaders || [],
          processingTime: parseResult.processingTime || 0,
          customerType: customerType === 'auto' ? 'auto-detected' : customerType
        })
      }
      
      setError(error instanceof Error ? error.message : 'Import failed')
      setStep('error')
      
      if (onImportError) {
        onImportError(error instanceof Error ? error.message : 'Import failed')
      }
    }
  }

  const batchImportCustomers = async (customers: any[]) => {
    const batchSize = 10
    const batches = []
    
    // Split into batches
    for (let i = 0; i < customers.length; i += batchSize) {
      batches.push(customers.slice(i, i + batchSize))
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
      customerIds: [] as string[],
      contactIds: [] as string[]
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      
      setImportProgress(prev => ({
        ...prev!,
        stage: `Processing batch ${batchIndex + 1} of ${batches.length}...`,
        currentBatch: batchIndex + 1,
        totalBatches: batches.length
      }))

      for (const customer of batch) {
        try {
          // Create customer account
          const accountData = {
            company_name: customer.company_name,
            customer_type: customer.customer_type,
            account_notes: customer.account_notes,
            tags: customer.tags || [],
            billing_address: customer.billing_address || {},
            service_address: customer.service_address || {}
          }

          const accountResult = await createCustomerAccount(accountData)
          
          if (accountResult.success && accountResult.data) {
            results.customerIds.push(accountResult.data.id)
            
            // Create primary contact if provided
            if (customer.primary_contact) {
              const contactResult = await createCustomerContact({
                ...customer.primary_contact,
                customer_account_id: accountResult.data.id
              })
              
              if (contactResult.success && contactResult.data) {
                results.contactIds.push(contactResult.data.id)
              }
            }
            
            results.successful++
          } else {
            results.failed++
            results.errors.push(`Failed to create customer "${customer.company_name}": ${accountResult.error}`)
          }
        } catch (error) {
          results.failed++
          results.errors.push(`Error creating customer "${customer.company_name}": ${error}`)
        }

        // Update progress
        setImportProgress(prev => ({
          ...prev!,
          processed: results.successful + results.failed,
          errors: results.failed
        }))
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }

  const handleStartOver = () => {
    setStep('upload')
    setFile(null)
    setParseResult(null)
    setError(null)
    setImportProgress(null)
    setImportResult(null)
  }

  const renderUploadStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Import Customer Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Type (Optional)
          </label>
          <Select value={customerType} onValueChange={setCustomerType}>
            <SelectTrigger>
              <SelectValue placeholder="Auto-detect from data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect from data</SelectItem>
              <SelectItem value="Commercial">Commercial Only</SelectItem>
              <SelectItem value="Residential">Residential Only</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            The system will automatically detect customer types if not specified
          </p>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive ? 'Drop your CSV file here' : 'Upload CSV File'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop or click to select a CSV file
          </p>
          <p className="text-xs text-gray-400">
            Maximum file size: 10MB
          </p>
        </div>

        {/* Format Requirements */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Supported Formats:</strong> The system accepts flexible CSV formats from Monday.com, QuickBooks, 
            and other platforms. Common column names are automatically mapped.
          </AlertDescription>
        </Alert>

        {/* Expected Columns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recommended CSV Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Company Name</li>
                  <li>• Customer Type</li>
                  <li>• Contact Name</li>
                  <li>• Email</li>
                  <li>• Phone</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Address & Notes</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Address / Street</li>
                  <li>• City</li>
                  <li>• State</li>
                  <li>• ZIP Code</li>
                  <li>• Notes</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Column names are flexible - the system will automatically match common variations
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )

  const renderProcessingStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Importing Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {importProgress && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-700 mb-2">
                {importProgress.stage}
              </div>
              <div className="text-sm text-gray-500">
                {importProgress.processed} of {importProgress.total} customers processed
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(importProgress.processed / importProgress.total) * 100}%` 
                }}
              />
            </div>

            {/* Batch Progress */}
            {importProgress.currentBatch && importProgress.totalBatches && (
              <div className="text-center text-sm text-gray-500">
                Batch {importProgress.currentBatch} of {importProgress.totalBatches}
              </div>
            )}

            {/* Error Count */}
            {importProgress.errors > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {importProgress.errors} errors encountered during import
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderCompleteStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Import Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {importResult && (
          <div className="space-y-4">
            {/* Success Summary */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully imported {importResult.successful} customers 
                {importResult.contactIds.length > 0 && ` with ${importResult.contactIds.length} contacts`}
              </AlertDescription>
            </Alert>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-sm text-gray-600">Customers Created</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.contactIds.length}</div>
                  <div className="text-sm text-gray-600">Contacts Created</div>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {importResult.failed > 0 && (
              <div>
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {importResult.failed} customers failed to import
                  </AlertDescription>
                </Alert>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        View Error Details
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono">
                        {importResult.errors.map((error: string, index: number) => (
                          <div key={index} className="text-red-600">{error}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleStartOver}>
            Import More Customers
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderErrorStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          Import Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-2">Import Failed</div>
            <div className="text-sm whitespace-pre-wrap">{error}</div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={handleStartOver}>
            Try Again
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && parseResult && (
        <CustomerImportPreview
          data={parseResult.previewData}
          isProcessing={false}
          onConfirmImport={handleConfirmImport}
          onCancel={handleStartOver}
          customerType={customerType !== 'auto' ? customerType : undefined}
        />
      )}
      {step === 'processing' && renderProcessingStep()}
      {step === 'complete' && renderCompleteStep()}
      {step === 'error' && renderErrorStep()}
    </div>
  )
}