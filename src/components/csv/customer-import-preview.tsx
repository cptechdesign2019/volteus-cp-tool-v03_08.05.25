'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Building, 
  Home, 
  Mail, 
  Phone, 
  MapPin,
  FileText
} from 'lucide-react'

interface ImportPreviewData {
  preview: any[]
  summary: {
    totalRows: number
    successfulImports: number
    errors: number
    warnings: number
    customerBreakdown: {
      total: number
      residential: number
      commercial: number
    }
    dataQuality: {
      withContacts: number
      withAddresses: number
      contactPercentage: number
      addressPercentage: number
    }
    hasMoreRows?: boolean
  }
}

interface CustomerImportPreviewProps {
  data: ImportPreviewData
  isProcessing: boolean
  onConfirmImport: () => void
  onCancel: () => void
  customerType?: string
}

export function CustomerImportPreview({ 
  data, 
  isProcessing, 
  onConfirmImport, 
  onCancel,
  customerType 
}: CustomerImportPreviewProps) {
  const { preview, summary } = data

  const renderCustomerCard = (customer: any, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {customer.customer_type === 'Residential' ? (
              <Home className="h-4 w-4 text-green-600" />
            ) : (
              <Building className="h-4 w-4 text-blue-600" />
            )}
            {customer.company_name || 'Unknown Company'}
          </CardTitle>
          <Badge 
            variant={customer.customer_type === 'Residential' ? 'default' : 'secondary'}
            className={
              customer.customer_type === 'Residential' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }
          >
            {customer.customer_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information */}
          {customer.primary_contact && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Primary Contact
              </h4>
              <div className="pl-4 space-y-1 text-sm">
                <div className="font-medium">{customer.primary_contact.contact_name}</div>
                {customer.primary_contact.email && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Mail className="h-3 w-3" />
                    {customer.primary_contact.email}
                  </div>
                )}
                {customer.primary_contact.phone && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Phone className="h-3 w-3" />
                    {customer.primary_contact.phone}
                  </div>
                )}
                {customer.primary_contact.role && (
                  <div className="text-gray-500 text-xs">{customer.primary_contact.role}</div>
                )}
              </div>
            </div>
          )}

          {/* Address Information */}
          {customer.billing_address && Object.keys(customer.billing_address).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Address
              </h4>
              <div className="pl-4 text-sm text-gray-600">
                {customer.billing_address.street && <div>{customer.billing_address.street}</div>}
                <div>
                  {[
                    customer.billing_address.city,
                    customer.billing_address.state,
                    customer.billing_address.zip_code
                  ].filter(Boolean).join(', ')}
                </div>
                {customer.billing_address.country && customer.billing_address.country !== 'USA' && (
                  <div>{customer.billing_address.country}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {(customer.account_notes || customer.tags?.length > 0) && (
          <div className="mt-4 pt-4 border-t">
            {customer.account_notes && (
              <div className="mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Notes:
                </span>
                <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {customer.account_notes}
                </div>
              </div>
            )}
            {customer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((tag: string, tagIndex: number) => (
                  <Badge key={tagIndex} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source row indicator */}
        <div className="mt-2 text-xs text-gray-400">
          Source: Row {customer._sourceRow}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.successfulImports}</div>
                <div className="text-sm text-gray-600">Ready to Import</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.dataQuality.contactPercentage}%</div>
                <div className="text-sm text-gray-600">With Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{summary.dataQuality.addressPercentage}%</div>
                <div className="text-sm text-gray-600">With Addresses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary.errors + summary.warnings}</div>
                <div className="text-sm text-gray-600">Issues Found</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{summary.customerBreakdown.commercial}</span>
              <span className="text-gray-600">Commercial</span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-green-600" />
              <span className="font-medium">{summary.customerBreakdown.residential}</span>
              <span className="text-gray-600">Residential</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Errors */}
      {(summary.errors > 0 || summary.warnings > 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Data Quality Notice:</strong> Found {summary.errors} errors and {summary.warnings} warnings. 
            The import will proceed with valid data only. Review the processing log for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Preview ({preview.length} of {summary.successfulImports} customers)
            {summary.hasMoreRows && (
              <Badge variant="outline" className="text-xs">
                Showing first {preview.length} rows
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {preview.map((customer, index) => renderCustomerCard(customer, index))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel Import
        </Button>
        
        <div className="flex gap-3">
          <Button 
            onClick={onConfirmImport} 
            disabled={isProcessing || summary.successfulImports === 0}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Import {summary.successfulImports} Customers
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}