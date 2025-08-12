'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Layers, 
  Building, 
  DollarSign, 
  Image as ImageIcon, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Import
} from 'lucide-react'

interface ProductImportPreviewProps {
  data: {
    success: boolean
    data: Array<any>
    headers: string[]
    summary: {
      totalRows: number
      uniqueBrands: number
      uniqueCategories: number
      withPricing: number
      withImages: number
      withSpecs: number
    }
    errors: string[]
    warnings: string[]
  }
  onImport: () => void
  onCancel: () => void
}

export function ProductImportPreview({ data, onImport, onCancel }: ProductImportPreviewProps) {
  const { summary, errors, warnings } = data
  const previewData = data.data.slice(0, 10) // Show first 10 rows

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Import Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{summary.totalRows}</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Building className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{summary.uniqueBrands}</div>
              <div className="text-sm text-gray-600">Brands</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Layers className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{summary.uniqueCategories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{summary.withPricing}</div>
              <div className="text-sm text-gray-600">With Pricing</div>
            </div>
            
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <ImageIcon className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
              <div className="text-2xl font-bold text-indigo-600">{summary.withImages}</div>
              <div className="text-sm text-gray-600">With Images</div>
            </div>
            
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold text-teal-600">{summary.withSpecs}</div>
              <div className="text-sm text-gray-600">With Specs</div>
            </div>
          </div>

          {/* Validation Results */}
          {errors.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">{errors.length} validation errors found:</div>
                  {errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                  {errors.length > 5 && (
                    <div className="text-sm text-gray-500">
                      ... and {errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">{warnings.length} warnings:</div>
                  {warnings.slice(0, 3).map((warning, index) => (
                    <div key={index} className="text-sm">{warning}</div>
                  ))}
                  {warnings.length > 3 && (
                    <div className="text-sm text-gray-500">
                      ... and {warnings.length - 3} more warnings
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {errors.length === 0 && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All products passed validation! Ready to import {summary.totalRows} products.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview (First 10 Rows)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Dealer Price</TableHead>
                  <TableHead>MSRP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {product.product_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {product.brand}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={product.product_name}>
                      {product.product_name}
                    </TableCell>
                    <TableCell>
                      {product.dealer_price ? (
                        <span className="text-green-600 font-medium">
                          ${product.dealer_price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.msrp ? (
                        <span className="text-blue-600 font-medium">
                          ${product.msrp.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {product.image_url && (
                          <span title="Has image">
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          </span>
                        )}
                        {product.spec_sheet_url && (
                          <span title="Has spec sheet">
                            <FileText className="h-4 w-4 text-green-500" />
                          </span>
                        )}
                        {(!product.image_url && !product.spec_sheet_url) && (
                          <span className="text-gray-400 text-sm">Basic</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.data.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing 10 of {data.data.length} products
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={onImport} 
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={errors.length > 0}
        >
          <Import className="h-4 w-4 mr-2" />
          Import {summary.totalRows} Products
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  )
}