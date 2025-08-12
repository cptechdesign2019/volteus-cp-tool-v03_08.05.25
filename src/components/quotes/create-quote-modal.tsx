'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'
import { createQuote } from '@/lib/api/quotes'
import { getCustomerAccounts } from '@/lib/api/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  title: string
  description: string
  customer_id: string
  expiration_date: string
  notes: string
}

export function CreateQuoteModal({ isOpen, onClose, onSuccess }: CreateQuoteModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    customer_id: '',
    expiration_date: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch customers for the dropdown
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customer-accounts'],
    queryFn: async () => {
      const result = await getCustomerAccounts()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch customers')
      }
      return result.data || []
    },
    enabled: isOpen // Only fetch when modal is open
  })

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: (result) => {
      if (result.success) {
        onSuccess()
        resetForm()
      } else {
        setErrors({ submit: result.error || 'Failed to create quote' })
      }
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to create quote' })
    }
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customer_id: '',
      expiration_date: '',
      notes: ''
    })
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Quote title is required'
    }

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer selection is required'
    }

    if (formData.expiration_date) {
      const expirationDate = new Date(formData.expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
      
      if (expirationDate < today) {
        newErrors.expiration_date = 'Expiration date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Prepare data for API
    const quoteData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      customer_id: formData.customer_id,
      expiration_date: formData.expiration_date || undefined,
      notes: formData.notes.trim() || undefined,
    }

    createQuoteMutation.mutate(quoteData)
  }

  const handleClose = () => {
    if (!createQuoteMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-clearpoint-navy" />
            Create New Quote
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quote Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Quote Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Conference Room AV System"
              className={errors.title ? 'border-red-500' : ''}
              disabled={createQuoteMutation.isPending}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Customer Selection */}
          <div>
            <Label htmlFor="customer_id" className="text-sm font-medium text-gray-700">
              Customer *
            </Label>
            <Select 
              value={formData.customer_id} 
              onValueChange={(value) => handleChange('customer_id', value)}
              disabled={createQuoteMutation.isPending || customersLoading}
            >
              <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select a customer"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the project requirements..."
              rows={3}
              disabled={createQuoteMutation.isPending}
            />
          </div>

          {/* Expiration Date */}
          <div>
            <Label htmlFor="expiration_date" className="text-sm font-medium text-gray-700">
              Expiration Date
            </Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => handleChange('expiration_date', e.target.value)}
              className={errors.expiration_date ? 'border-red-500' : ''}
              disabled={createQuoteMutation.isPending}
            />
            {errors.expiration_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expiration_date}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional. Leave blank if no expiration date is needed.
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Internal notes for this quote (not visible to customer)..."
              rows={2}
              disabled={createQuoteMutation.isPending}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createQuoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-warning bg-clearpoint-amber text-clearpoint-navy hover:bg-clearpoint-amber/90"
              disabled={createQuoteMutation.isPending}
            >
              {createQuoteMutation.isPending ? 'Creating...' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
