'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct, getDistinctBrands, getDistinctCategories, type Product } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertCircle, Package, DollarSign, Link, Image as ImageIcon, Save, X, Plus } from 'lucide-react'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null // If provided, edit mode. If null/undefined, add mode
  brands?: string[]
  categories?: string[]
}

interface FormData {
  product_id: string
  product_name: string
  product_number: string
  brand: string
  category: string
  description: string
  dealer_price: string
  msrp: string
  map_price: string
  primary_distributor: string
  secondary_distributor: string
  tertiary_distributor: string
  spec_sheet_url: string
  image_url: string
}

interface FormErrors {
  [key: string]: string
}

const initialFormData: FormData = {
  product_id: '',
  product_name: '',
  product_number: '',
  brand: '',
  category: '',
  description: '',
  dealer_price: '',
  msrp: '',
  map_price: '',
  primary_distributor: '',
  secondary_distributor: '',
  tertiary_distributor: '',
  spec_sheet_url: '',
  image_url: ''
}

export function AddProductModal({ 
  isOpen, 
  onClose, 
  product = null,
  brands = [], 
  categories = [] 
}: AddProductModalProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(product)
  
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate product ID for new products
  const generateProductId = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `PROD${timestamp}${random}`
  }

  // Initialize form data when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && product) {
        // Edit mode - populate with existing product data
        setFormData({
          product_id: product.product_id || '',
          product_name: product.product_name || '',
          product_number: product.product_number || '',
          brand: product.brand || '',
          category: product.category || '',
          description: product.description || '',
          dealer_price: product.dealer_price?.toString() || '',
          msrp: product.msrp?.toString() || '',
          map_price: product.map_price?.toString() || '',
          primary_distributor: product.primary_distributor || '',
          secondary_distributor: product.secondary_distributor || '',
          tertiary_distributor: product.tertiary_distributor || '',
          spec_sheet_url: product.spec_sheet_url || '',
          image_url: product.image_url || ''
        })
      } else {
        // Add mode - reset form and generate new product ID
        setFormData({
          ...initialFormData,
          product_id: generateProductId()
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditMode, product])

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['product-statistics'] })
        queryClient.invalidateQueries({ queryKey: ['product-brands'] })
        queryClient.invalidateQueries({ queryKey: ['product-categories'] })
        onClose()
        setFormData(initialFormData)
        setErrors({})
      } else {
        console.error('Create product error:', result.error)
        setErrors({ submit: result.error || 'Failed to create product' })
      }
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error('Create product mutation error:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create product' })
      setIsSubmitting(false)
    }
  })

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => updateProduct(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['product-statistics'] })
        onClose()
        setErrors({})
      } else {
        console.error('Update product error:', result.error)
        setErrors({ submit: result.error || 'Failed to update product' })
      }
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error('Update product mutation error:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update product' })
      setIsSubmitting(false)
    }
  })

  // Form validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.product_id.trim()) {
      newErrors.product_id = 'Product ID is required'
    }
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required'
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required'
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    // Validate prices
    if (formData.dealer_price && isNaN(Number(formData.dealer_price))) {
      newErrors.dealer_price = 'Dealer price must be a valid number'
    }
    if (formData.msrp && isNaN(Number(formData.msrp))) {
      newErrors.msrp = 'MSRP must be a valid number'
    }
    if (formData.map_price && isNaN(Number(formData.map_price))) {
      newErrors.map_price = 'MAP price must be a valid number'
    }

    // Validate URLs
    if (formData.spec_sheet_url && formData.spec_sheet_url.trim()) {
      try {
        new URL(formData.spec_sheet_url)
      } catch {
        newErrors.spec_sheet_url = 'Spec sheet URL must be a valid URL'
      }
    }
    if (formData.image_url && formData.image_url.trim()) {
      try {
        new URL(formData.image_url)
      } catch {
        newErrors.image_url = 'Image URL must be a valid URL'
      }
    }

    return newErrors
  }

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    // Prepare data for submission
    const submitData = {
      product_id: formData.product_id.trim(),
      product_name: formData.product_name.trim(),
      brand: formData.brand.trim(),
      category: formData.category.trim(),
      product_number: formData.product_number.trim() || undefined,
      description: formData.description.trim() || undefined,
      dealer_price: formData.dealer_price ? Number(formData.dealer_price) : undefined,
      msrp: formData.msrp ? Number(formData.msrp) : undefined,
      map_price: formData.map_price ? Number(formData.map_price) : undefined,
      primary_distributor: formData.primary_distributor.trim() || undefined,
      secondary_distributor: formData.secondary_distributor.trim() || undefined,
      tertiary_distributor: formData.tertiary_distributor.trim() || undefined,
      spec_sheet_url: formData.spec_sheet_url.trim() || undefined,
      image_url: formData.image_url.trim() || undefined
    }

    if (isEditMode && product) {
      updateMutation.mutate({ id: product.id, data: submitData })
    } else {
      createMutation.mutate(submitData as Omit<Product, 'id' | 'created_at' | 'updated_at'>)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setFormData(initialFormData)
      setErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-clearpoint-navy">
            {isEditMode ? (
              <>
                <Package className="h-5 w-5" />
                Edit Product
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add New Product
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 mt-1">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-clearpoint-navy mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product ID *</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id}
                    onChange={(e) => handleInputChange('product_id', e.target.value)}
                    placeholder="PROD12345678"
                    className={errors.product_id ? 'border-red-300' : ''}
                    disabled={isEditMode} // Don't allow editing product ID
                  />
                  {errors.product_id && (
                    <p className="text-sm text-red-600">{errors.product_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_number">Product Number</Label>
                  <Input
                    id="product_number"
                    value={formData.product_number}
                    onChange={(e) => handleInputChange('product_number', e.target.value)}
                    placeholder="SKU or model number"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    placeholder="Enter product name"
                    className={errors.product_name ? 'border-red-300' : ''}
                  />
                  {errors.product_name && (
                    <p className="text-sm text-red-600">{errors.product_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  {brands.length > 0 ? (
                    <Select
                      value={formData.brand}
                      onValueChange={(value) => handleInputChange('brand', value)}
                    >
                      <SelectTrigger className={errors.brand ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Enter brand name (e.g., Samsung, Sony, Crestron)"
                      className={errors.brand ? 'border-red-300' : ''}
                    />
                  )}
                  {errors.brand && (
                    <p className="text-sm text-red-600">{errors.brand}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  {categories.length > 0 ? (
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Enter category (e.g., Displays, Audio, Control Systems)"
                      className={errors.category ? 'border-red-300' : ''}
                    />
                  )}
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-clearpoint-navy mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealer_price">Dealer Price</Label>
                  <Input
                    id="dealer_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dealer_price}
                    onChange={(e) => handleInputChange('dealer_price', e.target.value)}
                    placeholder="0.00"
                    className={errors.dealer_price ? 'border-red-300' : ''}
                  />
                  {errors.dealer_price && (
                    <p className="text-sm text-red-600">{errors.dealer_price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="msrp">MSRP</Label>
                  <Input
                    id="msrp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.msrp}
                    onChange={(e) => handleInputChange('msrp', e.target.value)}
                    placeholder="0.00"
                    className={errors.msrp ? 'border-red-300' : ''}
                  />
                  {errors.msrp && (
                    <p className="text-sm text-red-600">{errors.msrp}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="map_price">MAP Price</Label>
                  <Input
                    id="map_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.map_price}
                    onChange={(e) => handleInputChange('map_price', e.target.value)}
                    placeholder="0.00"
                    className={errors.map_price ? 'border-red-300' : ''}
                  />
                  {errors.map_price && (
                    <p className="text-sm text-red-600">{errors.map_price}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distributor Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-clearpoint-navy mb-4">
                Distributor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_distributor">Primary Distributor</Label>
                  <Input
                    id="primary_distributor"
                    value={formData.primary_distributor}
                    onChange={(e) => handleInputChange('primary_distributor', e.target.value)}
                    placeholder="Primary distributor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_distributor">Secondary Distributor</Label>
                  <Input
                    id="secondary_distributor"
                    value={formData.secondary_distributor}
                    onChange={(e) => handleInputChange('secondary_distributor', e.target.value)}
                    placeholder="Secondary distributor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tertiary_distributor">Tertiary Distributor</Label>
                  <Input
                    id="tertiary_distributor"
                    value={formData.tertiary_distributor}
                    onChange={(e) => handleInputChange('tertiary_distributor', e.target.value)}
                    placeholder="Tertiary distributor name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links and Resources */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-clearpoint-navy mb-4 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Links & Resources
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spec_sheet_url">Spec Sheet URL</Label>
                  <Input
                    id="spec_sheet_url"
                    type="url"
                    value={formData.spec_sheet_url}
                    onChange={(e) => handleInputChange('spec_sheet_url', e.target.value)}
                    placeholder="https://example.com/spec.pdf"
                    className={errors.spec_sheet_url ? 'border-red-300' : ''}
                  />
                  {errors.spec_sheet_url && (
                    <p className="text-sm text-red-600">{errors.spec_sheet_url}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={errors.image_url ? 'border-red-300' : ''}
                  />
                  {errors.image_url && (
                    <p className="text-sm text-red-600">{errors.image_url}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-clearpoint-silver">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}