'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Users, Database, AlertCircle, Upload } from 'lucide-react'

interface CustomerEmptyStatesProps {
  type: 'initial' | 'no-results' | 'error'
  searchTerm?: string
  customerType?: string | null
  onClear?: () => void
  onRetry?: () => void
  error?: string
}

export function CustomerEmptyStates({ 
  type, 
  searchTerm, 
  customerType, 
  onClear, 
  onRetry,
  error 
}: CustomerEmptyStatesProps) {
  if (type === 'initial') {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 mx-auto text-primary-300 mb-4" />
        <h3 className="text-xl font-medium text-primary-800 mb-2">
          Ready to Search
        </h3>
        <p className="text-primary-600 max-w-md mx-auto">
          Enter a search term or select a customer type to view customers
        </p>
      </div>
    )
  }

  if (type === 'no-results') {
    const hasFilters = searchTerm?.trim() || customerType

    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Customers Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {hasFilters ? (
                <>
                  We couldn't find any customers matching your search criteria.
                  {searchTerm && (
                    <span className="block mt-2">
                      Search term: <strong>"{searchTerm}"</strong>
                    </span>
                  )}
                  {customerType && (
                    <span className="block mt-1">
                      Customer type: <strong>{customerType}</strong>
                    </span>
                  )}
                </>
              ) : (
                'No customers have been added to your system yet.'
              )}
            </p>
            
            <div className="space-y-3">
              {hasFilters && onClear && (
                <Button variant="outline" onClick={onClear}>
                  Clear Search Filters
                </Button>
              )}
              
              <div className="text-sm text-gray-400">
                <p>Try adjusting your search terms or:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Check for typos in company or contact names</li>
                  <li>• Try searching with partial names</li>
                  <li>• Remove customer type filters</li>
                  <li>• Import customers from CSV files</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'error') {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Error
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {error || 'An error occurred while searching for customers. Please try again.'}
            </p>
            
            <div className="space-y-3">
              {onRetry && (
                <Button onClick={onRetry}>
                  Try Again
                </Button>
              )}
              
              {onClear && (
                <Button variant="outline" onClick={onClear}>
                  Clear Search
                </Button>
              )}
              
              <div className="text-sm text-gray-400 mt-4">
                <p>If the problem persists:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Refresh the page and try again</li>
                  <li>• Contact support if the issue continues</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}