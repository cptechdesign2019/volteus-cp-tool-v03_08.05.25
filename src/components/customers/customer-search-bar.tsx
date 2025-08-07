'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'

interface CustomerSearchBarProps {
  onSearch: (searchTerm: string, customerType: string | null) => void
  isLoading?: boolean
  resultsCount?: number
  onClear?: () => void
  customers?: any[] // Add this to track results for focus management
}

export function CustomerSearchBar({ 
  onSearch, 
  isLoading = false, 
  resultsCount,
  onClear,
  customers = []
}: CustomerSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customerType, setCustomerType] = useState<string>('all')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search term - longer delay to prevent interruption
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1500) // 1.5 second delay - won't interrupt typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Only trigger search automatically if user stops typing for a while AND has content
  useEffect(() => {
    // Only auto-search if there's actual content and user has stopped typing
    if (debouncedSearchTerm.trim().length > 2) {
      handleSearch()
    }
    // Don't auto-search on customer type change - require explicit action
  }, [debouncedSearchTerm])

  // Re-focus input after results update (handles all cases: results, no results, errors)
  useEffect(() => {
    if (resultsCount !== undefined && searchInputRef.current) {
      // Small delay to ensure DOM has updated with results
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 150)
    }
  }, [resultsCount, customers])

  const handleSearch = () => {
    const typeFilter = customerType === 'all' ? null : customerType
    onSearch(debouncedSearchTerm.trim(), typeFilter)
    // Focus will be handled by the useEffect after results update
  }

  const handleClear = () => {
    setSearchTerm('')
    setCustomerType('all')
    setDebouncedSearchTerm('')
    if (onClear) {
      onClear()
    }
  }

  const handleManualSearch = () => {
    const typeFilter = customerType === 'all' ? null : customerType
    onSearch(searchTerm.trim(), typeFilter)
    // Focus will be handled by the useEffect after results update
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualSearch()
    }
  }

  const hasActiveFilters = searchTerm.trim() || customerType !== 'all'
  const showResults = resultsCount !== undefined

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex flex-col gap-4">
        {/* Top Row: Search Input and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input with Separate Icon Box */}
          <div className="flex-1 flex items-center gap-2">
            {/* Magnifying Glass Box - Same height as input */}
            <div className="flex items-center justify-center w-12 h-12 bg-clearpoint-platinum border border-clearpoint-silver rounded-lg">
              <Search className="h-4 w-4 text-clearpoint-slateGray" />
            </div>
            
            {/* Search Input */}
            <Input
              ref={searchInputRef}
              placeholder="Search customers by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 focus:ring-clearpoint-navy/20 border-clearpoint-silver h-12 placeholder-clearpoint-slateGray"
              disabled={false} // Never disable input - show spinner instead
              autoFocus={hasActiveFilters}
            />
          </div>

          {/* Customer Type Filter */}
          <div className="sm:w-48">
            <Select value={customerType} onValueChange={(value) => {
              setCustomerType(value)
              // Don't auto-search on type change - let user control when to search
            }} disabled={isLoading}>
              <SelectTrigger className="w-full border-clearpoint-silver text-clearpoint-navy hover:border-clearpoint-navy focus:border-clearpoint-navy focus:ring-clearpoint-navy/10 h-12">
                <Filter className="h-4 w-4 mr-2 text-clearpoint-slateGray" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="Residential">Residential Only</SelectItem>
                <SelectItem value="Commercial">Commercial Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom Row: Clear Button and Search Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Clear Button - Left-most position under magnifying glass */}
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isLoading}
              className="btn-secondary shrink-0"
            >
              <X className="h-4 w-4 mr-2 text-clearpoint-slateGray" />
              Clear
            </Button>

            {/* Search Term Badge */}
            {searchTerm.trim() && (
              <Badge className="gap-1 bg-clearpoint-platinum text-clearpoint-navy border-clearpoint-silver hover:bg-clearpoint-alabaster">
                <Search className="h-3 w-3" />
                "{searchTerm.trim()}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-clearpoint-slateGray"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Customer Type Badge */}
            {customerType !== 'all' && (
              <Badge className="gap-1 bg-clearpoint-platinum text-clearpoint-navy border-clearpoint-silver hover:bg-clearpoint-alabaster">
                <Filter className="h-3 w-3" />
                {customerType}
                <button
                  onClick={() => setCustomerType('all')}
                  className="ml-1 hover:text-clearpoint-slateGray"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <Badge variant="outline" className="gap-1 bg-clearpoint-alabaster border-clearpoint-silver">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-clearpoint-navy"></div>
                Searching...
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {showResults && (
        <div className="flex justify-end">
          <div className="text-sm text-clearpoint-slateGray">
            {isLoading ? (
              'Searching...'
            ) : resultsCount === 0 ? (
              'No customers found'
            ) : resultsCount === 1 ? (
              '1 customer found'
            ) : (
              `${resultsCount} customers found`
            )}
          </div>
        </div>
      )}


    </div>
  )
}