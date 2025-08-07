'use client'

import React, { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  searchProducts, 
  getDistinctBrands, 
  getDistinctCategories, 
  getProductStatistics,
  type Product,
  type ProductSearchParams 
} from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddProductModal } from '@/components/product-library/add-product-modal'
import { ProductCsvImportModal } from '@/components/product-library/product-csv-import-modal'
import { 
  Search, 
  Upload, 
  Edit2, 
  Trash2, 
  Package, 
  TrendingUp, 
  Database,
  ShoppingCart,
  Filter,
  X
} from 'lucide-react'

interface ProductDashboardProps {
  className?: string
}

export function ProductDashboard({ className }: ProductDashboardProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortBy, setSortBy] = useState('product_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)

  // Debounce search to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 600)

  // Handle CSV import success
  const handleCsvImportSuccess = () => {
    // Refresh the data
    refetchProducts()
    refetchBrands()
    refetchCategories()
    refetchStats()
  }

  // Check if we have active search/filter criteria
  const hasActiveFilters = Boolean(
    debouncedSearchQuery.trim() || 
    selectedBrand || 
    selectedCategory
  )

  // Build search parameters
  const searchParams: ProductSearchParams = {
    searchTerm: debouncedSearchQuery.trim(),
    brand: selectedBrand || undefined,
    category: selectedCategory || undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder
  }

  // Queries
  const { 
    data: productsResult, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['products', searchParams],
    queryFn: () => searchProducts(searchParams),
    enabled: hasActiveFilters,
    staleTime: 30000,
  })

  const { data: brandsResult, refetch: refetchBrands } = useQuery({
    queryKey: ['product-brands'],
    queryFn: () => getDistinctBrands(),
    staleTime: 300000, // 5 minutes
  })

  const { data: categoriesResult, refetch: refetchCategories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => getDistinctCategories(),
    staleTime: 300000, // 5 minutes
  })

  const { data: statsResult, refetch: refetchStats } = useQuery({
    queryKey: ['product-statistics'],
    queryFn: () => getProductStatistics(),
    staleTime: 60000, // 1 minute
  })

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  const handleBrandChange = useCallback((value: string) => {
    setSelectedBrand(value === 'all' ? '' : value)
    setCurrentPage(1)
  }, [])

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value === 'all' ? '' : value)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedBrand('')
    setSelectedCategory('')
    setCurrentPage(1)
  }, [])

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }, [sortBy, sortOrder])

  // Format price utility
  const formatPrice = (price?: number) => {
    if (price === null || price === undefined) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Extract data from API responses
  const brands = brandsResult?.success ? brandsResult.data || [] : []
  const categories = categoriesResult?.success ? categoriesResult.data || [] : []
  const products = productsResult?.success ? productsResult.data || [] : []
  const pagination = productsResult?.success ? productsResult.pagination : null
  const stats = statsResult?.success ? statsResult.data : null
  const error = productsError?.message || (productsResult?.success === false ? productsResult.error : null)

  return (
    <div className={`space-y-8 min-h-screen ${className || ''}`}>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-600">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-800">
              {stats ? stats.totalProducts.toLocaleString() : <Skeleton className="h-8 w-16 bg-primary-100" />}
            </div>
            <p className="text-xs text-primary-600">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-600">Brands</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-800">
              {stats ? stats.totalBrands : <Skeleton className="h-8 w-12 bg-primary-100" />}
            </div>
            <p className="text-xs text-primary-600">
              Unique manufacturers
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary-200 bg-gradient-to-br from-green-50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-600">Categories</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-800">
              {stats ? stats.totalCategories : <Skeleton className="h-8 w-12 bg-primary-100" />}
            </div>
            <p className="text-xs text-primary-600">
              Product types
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-600">Avg. Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-800">
              {stats ? formatPrice(stats.averagePrice) : <Skeleton className="h-8 w-20 bg-primary-100" />}
            </div>
            <p className="text-xs text-primary-600">
              Dealer pricing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Management Section */}
      <div className="bg-white rounded-lg border border-primary-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <div>
            <h2 className="text-xl font-semibold text-primary-800">Product Catalog</h2>
            <p className="text-primary-600 text-sm mt-1">Search and manage your product inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="btn-secondary" 
              variant="outline"
              onClick={() => setIsCsvImportOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              className="btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 bg-clearpoint-platinum border border-clearpoint-silver rounded-lg">
                  <Search className="h-4 w-4 text-clearpoint-slateGray" />
                </div>
                <Input
                  placeholder="Search products by name, description, or number..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 h-12 placeholder-clearpoint-slateGray"
                />
              </div>

              {/* Brand Filter */}
              <div className="sm:w-48">
                <Select value={selectedBrand || 'all'} onValueChange={handleBrandChange}>
                  <SelectTrigger className="w-full h-12 border-clearpoint-silver text-clearpoint-navy">
                    <Filter className="h-4 w-4 mr-2 text-clearpoint-slateGray" />
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="sm:w-48">
                <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full h-12 border-clearpoint-silver text-clearpoint-navy">
                    <Filter className="h-4 w-4 mr-2 text-clearpoint-slateGray" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedBrand || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="btn-secondary shrink-0"
                >
                  <X className="h-4 w-4 mr-2 text-clearpoint-slateGray" />
                  Clear
                </Button>

                {searchQuery && (
                  <Badge className="gap-1 bg-clearpoint-platinum text-clearpoint-navy border-clearpoint-silver">
                    <Search className="h-3 w-3" />
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-clearpoint-slateGray"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {selectedBrand && (
                  <Badge className="gap-1 bg-clearpoint-platinum text-clearpoint-navy border-clearpoint-silver">
                    <Filter className="h-3 w-3" />
                    {selectedBrand}
                    <button
                      onClick={() => setSelectedBrand('')}
                      className="ml-1 hover:text-clearpoint-slateGray"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {selectedCategory && (
                  <Badge className="gap-1 bg-clearpoint-platinum text-clearpoint-navy border-clearpoint-silver">
                    <Filter className="h-3 w-3" />
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="ml-1 hover:text-clearpoint-slateGray"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mt-6">
            {!hasActiveFilters ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 mx-auto text-primary-300 mb-4" />
                <h3 className="text-xl font-medium text-primary-800 mb-2">
                  Ready to Search
                </h3>
                <p className="text-primary-600 max-w-md mx-auto">
                  Enter a search term or select filters to view products from your catalog
                </p>
              </div>
            ) : productsLoading ? (
              <ProductTableSkeleton />
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">⚠️ Search Error</div>
                <p className="text-red-600">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-primary-300 mb-4" />
                <h3 className="text-xl font-medium text-primary-800 mb-2">
                  No Products Found
                </h3>
                <p className="text-primary-600">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-clearpoint-slateGray">
                    {pagination ? (
                      `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} products`
                    ) : (
                      `${products.length} products found`
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="border border-clearpoint-silver rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-clearpoint-platinum">
                        <TableHead className="text-clearpoint-navy font-semibold">Product</TableHead>
                        <TableHead className="text-clearpoint-navy font-semibold">Brand</TableHead>
                        <TableHead className="text-clearpoint-navy font-semibold">Category</TableHead>
                        <TableHead className="text-clearpoint-navy font-semibold text-right">Dealer Price</TableHead>
                        <TableHead className="text-clearpoint-navy font-semibold text-right">MSRP</TableHead>
                        <TableHead className="text-clearpoint-navy font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-clearpoint-alabaster">
                          <TableCell>
                            <div>
                              <div className="font-medium text-clearpoint-navy">
                                {product.product_name}
                              </div>
                              {product.product_number && (
                                <div className="text-sm text-clearpoint-slateGray">
                                  #{product.product_number}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-clearpoint-charcoal">
                            {product.brand}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-clearpoint-cyan/10 text-clearpoint-cyan border-clearpoint-cyan/30">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-clearpoint-navy">
                            {formatPrice(product.dealer_price)}
                          </TableCell>
                          <TableCell className="text-right text-clearpoint-slateGray">
                            {formatPrice(product.msrp)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-clearpoint-coral/10"
                              >
                                <Edit2 className="h-4 w-4 text-clearpoint-coral" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-clearpoint-crimson/10"
                              >
                                <Trash2 className="h-4 w-4 text-clearpoint-crimson" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination (placeholder for now) */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-clearpoint-slateGray">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setCurrentPage(pagination.page - 1)}
                        className="btn-secondary"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setCurrentPage(pagination.page + 1)}
                        className="btn-secondary"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        brands={brands}
        categories={categories}
      />

      {/* CSV Import Modal */}
      <ProductCsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={handleCsvImportSuccess}
      />
    </div>
  )
}

// Loading skeleton for product table
function ProductTableSkeleton() {
  return (
    <div className="border border-clearpoint-silver rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-clearpoint-platinum">
            <TableHead>Product</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Dealer Price</TableHead>
            <TableHead>MSRP</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-primary-100" />
                  <Skeleton className="h-3 w-20 bg-primary-100" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 bg-primary-100" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 bg-primary-100 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16 bg-primary-100 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16 bg-primary-100 ml-auto" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-8 w-8 bg-primary-100 rounded" />
                  <Skeleton className="h-8 w-8 bg-primary-100 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}