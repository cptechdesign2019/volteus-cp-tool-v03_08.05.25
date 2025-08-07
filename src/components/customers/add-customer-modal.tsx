'use client'

import React, { useState } from 'react'
// import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building, 
  Home, 
  MapPin, 
  User, 
  Plus,
  X,
  Save,
  Loader2,
  AlertCircle,
  UserPlus,
  Trash2
} from 'lucide-react'
import { createCustomerAccount, createCustomerContact } from '@/lib/api/customers'

interface CustomerContact {
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
  zip_code?: string
  country?: string
}

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  // const queryClient = useQueryClient()
  
  // Initial form state
  const initialAccountForm = {
    company_name: '',
    customer_type: 'Residential' as 'Residential' | 'Commercial',
    account_notes: '',
    tags: [] as string[],
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA'
    } as Address,
    service_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA'
    } as Address
  }

  const initialContact = {
    contact_name: '',
    email: '',
    phone: '',
    role: '',
    is_primary_contact: true
  }

  // Form state
  const [accountForm, setAccountForm] = useState(initialAccountForm)
  const [contacts, setContacts] = useState<CustomerContact[]>([initialContact])
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setAccountForm(initialAccountForm)
      setContacts([initialContact])
      setNewTag('')
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate account information
    if (!accountForm.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    // Validate contacts
    if (contacts.length === 0) {
      newErrors.contacts = 'At least one contact is required'
    }

    // Validate at least one primary contact
    const primaryContacts = contacts.filter(c => c.is_primary_contact)
    if (primaryContacts.length === 0) {
      newErrors.contacts = 'At least one primary contact is required'
    } else if (primaryContacts.length > 1) {
      newErrors.contacts = 'Only one primary contact is allowed'
    }

    // Validate individual contacts
    contacts.forEach((contact, index) => {
      if (!contact.contact_name.trim()) {
        newErrors[`contact_${index}_name`] = 'Contact name is required'
      }
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors[`contact_${index}_email`] = 'Invalid email format'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAccountFormChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setAccountForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setAccountForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleContactChange = (index: number, field: string, value: any) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ))
  }

  const addContact = () => {
    setContacts(prev => [...prev, {
      contact_name: '',
      email: '',
      phone: '',
      role: '',
      is_primary_contact: false
    }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) { // Ensure at least one contact remains
      setContacts(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addTag = () => {
    if (newTag.trim() && !accountForm.tags.includes(newTag.trim())) {
      handleAccountFormChange('tags', [...accountForm.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleAccountFormChange('tags', accountForm.tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // First create the customer account
      const accountResult = await createCustomerAccount({
        company_name: accountForm.company_name,
        customer_type: accountForm.customer_type,
        account_notes: accountForm.account_notes,
        tags: accountForm.tags,
        billing_address: accountForm.billing_address,
        service_address: accountForm.service_address
      })
      
      if (accountResult.success && accountResult.data) {
        // Then create all contacts
        const contactPromises = contacts.map((contact: CustomerContact) => 
          createCustomerContact({
            ...contact,
            customer_account_id: accountResult.data.id
          })
        )
        
        await Promise.all(contactPromises)
        
        console.log('Customer created successfully!')
        if (onSuccess) onSuccess()
        onClose()
      } else {
        throw new Error(accountResult.error || 'Failed to create customer account')
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error)
      setErrors({ submit: error.message || 'Failed to create customer' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-white DialogContent">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Account Information */}
              <div className="space-y-6">
                <Card className="Card bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Company Name */}
                    <div>
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={accountForm.company_name}
                        onChange={(e) => handleAccountFormChange('company_name', e.target.value)}
                        className={errors.company_name ? 'border-red-500' : ''}
                        placeholder="Enter company or customer name"
                      />
                      {errors.company_name && (
                        <div className="text-sm text-red-500 mt-1">{errors.company_name}</div>
                      )}
                    </div>

                    {/* Customer Type */}
                    <div>
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
                              <Home className="h-4 w-4" />
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

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {accountForm.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Account Notes */}
                    <div>
                      <Label htmlFor="account_notes">Account Notes</Label>
                      <Textarea
                        id="account_notes"
                        value={accountForm.account_notes}
                        onChange={(e) => handleAccountFormChange('account_notes', e.target.value)}
                        rows={4}
                        placeholder="Add any additional notes about this customer..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Addresses */}
                <Card className="Card bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Billing Address */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Billing Address</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          placeholder="Street Address"
                          value={accountForm.billing_address.street}
                          onChange={(e) => handleAccountFormChange('billing_address.street', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="City"
                            value={accountForm.billing_address.city}
                            onChange={(e) => handleAccountFormChange('billing_address.city', e.target.value)}
                          />
                          <Input
                            placeholder="State"
                            value={accountForm.billing_address.state}
                            onChange={(e) => handleAccountFormChange('billing_address.state', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="ZIP Code"
                            value={accountForm.billing_address.zip_code}
                            onChange={(e) => handleAccountFormChange('billing_address.zip_code', e.target.value)}
                          />
                          <Input
                            placeholder="Country"
                            value={accountForm.billing_address.country}
                            onChange={(e) => handleAccountFormChange('billing_address.country', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Service Address */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Service Address</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          placeholder="Street Address"
                          value={accountForm.service_address.street}
                          onChange={(e) => handleAccountFormChange('service_address.street', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="City"
                            value={accountForm.service_address.city}
                            onChange={(e) => handleAccountFormChange('service_address.city', e.target.value)}
                          />
                          <Input
                            placeholder="State"
                            value={accountForm.service_address.state}
                            onChange={(e) => handleAccountFormChange('service_address.state', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="ZIP Code"
                            value={accountForm.service_address.zip_code}
                            onChange={(e) => handleAccountFormChange('service_address.zip_code', e.target.value)}
                          />
                          <Input
                            placeholder="Country"
                            value={accountForm.service_address.country}
                            onChange={(e) => handleAccountFormChange('service_address.country', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Contacts */}
              <div className="space-y-6">
                <Card className="Card bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contacts ({contacts.length})
                      </div>
                      <Button type="button" onClick={addContact} variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {errors.contacts && (
                      <div className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.contacts}
                      </div>
                    )}

                    {contacts.map((contact, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">Contact {index + 1}</span>
                            {contact.is_primary_contact && (
                              <Badge variant="default" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          {contacts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={contact.contact_name}
                              onChange={(e) => handleContactChange(index, 'contact_name', e.target.value)}
                              className={errors[`contact_${index}_name`] ? 'border-red-500' : ''}
                              placeholder="Contact person name"
                            />
                            {errors[`contact_${index}_name`] && (
                              <div className="text-sm text-red-500 mt-1">{errors[`contact_${index}_name`]}</div>
                            )}
                          </div>

                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                              className={errors[`contact_${index}_email`] ? 'border-red-500' : ''}
                              placeholder="email@example.com"
                            />
                            {errors[`contact_${index}_email`] && (
                              <div className="text-sm text-red-500 mt-1">{errors[`contact_${index}_email`]}</div>
                            )}
                          </div>

                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                              placeholder="(555) 123-4567"
                            />
                          </div>

                          <div>
                            <Label>Role</Label>
                            <Input
                              value={contact.role}
                              onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                              placeholder="e.g., Owner, Manager, Contact Person"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`primary_${index}`}
                              checked={contact.is_primary_contact}
                              onChange={(e) => {
                                // If setting as primary, unset all others
                                if (e.target.checked) {
                                  setContacts(prev => prev.map((c, i) => ({
                                    ...c,
                                    is_primary_contact: i === index
                                  })))
                                } else {
                                  handleContactChange(index, 'is_primary_contact', false)
                                }
                              }}
                            />
                            <Label htmlFor={`primary_${index}`}>Primary Contact</Label>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Helper text */}
                    <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800">Contact Requirements:</p>
                          <ul className="text-blue-700 mt-1 space-y-1 text-xs">
                            <li>• At least one contact is required</li>
                            <li>• Exactly one contact must be marked as primary</li>
                            <li>• Email format will be validated if provided</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Create Customer
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}