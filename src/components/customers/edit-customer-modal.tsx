'use client'

import { useState, useEffect } from 'react'
import { updateCustomerAccount, updateCustomerContact } from '@/lib/api/customers'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Loader2, Save, Building, User } from 'lucide-react'

interface CustomerContact {
  id?: string
  contact_name: string
  email?: string
  phone?: string
  role?: string
  is_primary_contact: boolean
}

interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

interface Customer {
  id: string
  company_name: string
  customer_type: 'Residential' | 'Commercial'
  billing_address?: Address
  service_address?: Address
  account_notes?: string
  tags?: string[]
  contacts?: CustomerContact[]
}

interface EditCustomerModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditCustomerModal({ customer, isOpen, onClose, onSuccess }: EditCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [accountForm, setAccountForm] = useState({
    company_name: '',
    customer_type: 'Commercial' as 'Residential' | 'Commercial',
    account_notes: '',
    tags: [] as string[]
  })
  
  const [billingAddress, setBillingAddress] = useState<Address>({})
  const [serviceAddress, setServiceAddress] = useState<Address>({})
  const [newTag, setNewTag] = useState('')

  // Initialize form when customer data changes
  useEffect(() => {
    if (customer) {
      setAccountForm({
        company_name: customer.company_name || '',
        customer_type: customer.customer_type || 'Commercial',
        account_notes: customer.account_notes || '',
        tags: customer.tags || []
      })
      setBillingAddress(customer.billing_address || {})
      setServiceAddress(customer.service_address || {})
    }
  }, [customer])

  const handleAccountFormChange = (field: string, value: any) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (type: 'billing' | 'service', field: string, value: string) => {
    if (type === 'billing') {
      setBillingAddress(prev => ({ ...prev, [field]: value }))
    } else {
      setServiceAddress(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !accountForm.tags.includes(newTag.trim())) {
      setAccountForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setAccountForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async () => {
    if (!customer) return
    
    setIsLoading(true)
    setError('')
    
    try {
      console.log('Updating customer:', customer.id)
      
      // Update customer account
      const accountResult = await updateCustomerAccount(customer.id, {
        company_name: accountForm.company_name,
        customer_type: accountForm.customer_type,
        account_notes: accountForm.account_notes,
        tags: accountForm.tags,
        billing_address: billingAddress,
        service_address: serviceAddress
      })
      
      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to update customer')
      }
      
      console.log('Customer updated successfully')
      
      // Call success callback and close modal
      if (onSuccess) onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error updating customer:', error)
      setError(error.message || 'Failed to update customer')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    if (customer) {
      setAccountForm({
        company_name: customer.company_name || '',
        customer_type: customer.customer_type || 'Commercial',
        account_notes: customer.account_notes || '',
        tags: customer.tags || []
      })
      setBillingAddress(customer.billing_address || {})
      setServiceAddress(customer.service_address || {})
    }
    setNewTag('')
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Customer: {customer?.company_name}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5" />
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={accountForm.company_name}
                  onChange={(e) => handleAccountFormChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_type">Customer Type</Label>
                <Select 
                  value={accountForm.customer_type} 
                  onValueChange={(value) => handleAccountFormChange('customer_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Residential
                      </div>
                    </SelectItem>
                    <SelectItem value="Commercial">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Commercial
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {accountForm.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="account_notes">Account Notes</Label>
              <Textarea
                id="account_notes"
                value={accountForm.account_notes}
                onChange={(e) => handleAccountFormChange('account_notes', e.target.value)}
                placeholder="Enter any notes about this customer..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={billingAddress.street || ''}
                  onChange={(e) => handleAddressChange('billing', 'street', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={billingAddress.city || ''}
                  onChange={(e) => handleAddressChange('billing', 'city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={billingAddress.state || ''}
                  onChange={(e) => handleAddressChange('billing', 'state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
              
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={billingAddress.zip || ''}
                  onChange={(e) => handleAddressChange('billing', 'zip', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={billingAddress.country || ''}
                  onChange={(e) => handleAddressChange('billing', 'country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={serviceAddress.street || ''}
                  onChange={(e) => handleAddressChange('service', 'street', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={serviceAddress.city || ''}
                  onChange={(e) => handleAddressChange('service', 'city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={serviceAddress.state || ''}
                  onChange={(e) => handleAddressChange('service', 'state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
              
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={serviceAddress.zip || ''}
                  onChange={(e) => handleAddressChange('service', 'zip', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={serviceAddress.country || ''}
                  onChange={(e) => handleAddressChange('service', 'country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isLoading}
          >
            Reset Changes
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !accountForm.company_name.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}