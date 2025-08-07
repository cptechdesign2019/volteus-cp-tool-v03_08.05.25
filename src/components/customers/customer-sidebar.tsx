'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building, 
  Home, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Edit, 
  X,
  FileText,
  Tag,
  Users,
  Trash2
} from 'lucide-react'

interface CustomerContact {
  id: string
  contact_name: string
  email: string
  phone: string
  role: string
  is_primary_contact: boolean
  contact_notes?: string
}

interface Customer {
  id: string
  company_name: string
  customer_type: 'Residential' | 'Commercial'
  billing_address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  service_address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  account_notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
  contacts?: CustomerContact[]
  customer_contacts?: CustomerContact[] // Alternative field name from Supabase join
}

interface CustomerSidebarProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
}

export function CustomerSidebar({ 
  customer, 
  isOpen, 
  onClose, 
  onEdit,
  onDelete
}: CustomerSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!customer) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAddress = (address?: any) => {
    if (!address) return null
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zip) parts.push(address.zip)
    if (address.country) parts.push(address.country)
    return parts.length > 0 ? parts.join(', ') : null
  }

  // Handle both contacts and customer_contacts field names
  const allContacts = customer.contacts || customer.customer_contacts || []

  const getPrimaryContact = (contacts?: CustomerContact[]) => {
    if (!contacts || contacts.length === 0) return null
    return contacts.find(c => c.is_primary_contact) || contacts[0]
  }

  const getSecondaryContacts = (contacts?: CustomerContact[]) => {
    if (!contacts || contacts.length === 0) return []
    return contacts.filter(c => !c.is_primary_contact)
  }

  const primaryContact = getPrimaryContact(allContacts)
  const secondaryContacts = getSecondaryContacts(allContacts)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(customer)
    }
    setIsEditing(true)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(customer)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[1600px] sm:w-[1600px] max-w-[90vw] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold text-gray-900 font-montserrat">
                  {customer.company_name}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={customer.customer_type === 'Residential' ? 'default' : 'secondary'}
                    className={
                      customer.customer_type === 'Residential' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }
                  >
                    {customer.customer_type === 'Residential' ? (
                      <Home className="h-3 w-3 mr-1" />
                    ) : (
                      <Building className="h-3 w-3 mr-1" />
                    )}
                    {customer.customer_type}
                  </Badge>
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {customer.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Column 1: Contact Information */}
                  <div className="space-y-6">
                    {/* Primary Contact */}
                    {primaryContact && (
                      <Card className="h-fit">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Primary Contact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center pb-4 border-b">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <User className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="font-semibold text-lg text-gray-900">
                              {primaryContact.contact_name}
                            </div>
                            {primaryContact.role && (
                              <div className="text-sm text-gray-500 mt-1">
                                {primaryContact.role}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            {primaryContact.email && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <a 
                                  href={`mailto:${primaryContact.email}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {primaryContact.email}
                                </a>
                              </div>
                            )}
                            
                            {primaryContact.phone && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <a 
                                  href={`tel:${primaryContact.phone}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {primaryContact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Additional Contacts */}
                    {secondaryContacts.length > 0 && (
                      <Card className="h-fit">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            Additional Contacts ({secondaryContacts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {secondaryContacts.map((contact, index) => (
                            <div key={contact.id || index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-900 mb-2">
                                {contact.contact_name}
                              </div>
                              {contact.role && (
                                <div className="text-sm text-gray-500 mb-3">
                                  {contact.role}
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <a 
                                      href={`mailto:${contact.email}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                
                                {contact.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <a 
                                      href={`tel:${contact.phone}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {contact.phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Column 2: Address Information */}
                  <div className="space-y-6">
                    {/* Billing Address */}
                    {customer.billing_address && (
                      <Card className="h-fit">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-purple-600" />
                            Billing Address
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-gray-800 leading-relaxed">
                              {formatAddress(customer.billing_address)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Service Address */}
                    {customer.service_address && (
                      <Card className="h-fit">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-orange-600" />
                            Service Address
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-gray-800 leading-relaxed">
                              {formatAddress(customer.service_address)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Account Notes */}
                    {customer.account_notes && (
                      <Card className="h-fit">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            Account Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {customer.account_notes}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Column 3: Account Details & Metadata */}
                  <div className="space-y-6">
                    {/* Account Information */}
                    <Card className="h-fit">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-emerald-600" />
                          Account Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="text-sm text-emerald-600 font-medium">Created</div>
                              <div className="text-gray-900 font-semibold">
                                {formatDate(customer.created_at)}
                              </div>
                            </div>
                            
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="text-sm text-emerald-600 font-medium">Last Updated</div>
                              <div className="text-gray-900 font-semibold">
                                {formatDate(customer.updated_at)}
                              </div>
                            </div>
                            
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="text-sm text-emerald-600 font-medium">Total Contacts</div>
                              <div className="text-gray-900 font-semibold text-2xl">
                                {allContacts?.length || 0}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <div className="text-xs text-gray-500 font-medium mb-2">Customer ID</div>
                            <div className="text-xs text-gray-700 font-mono bg-gray-100 p-2 rounded break-all">
                              {customer.id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Type & Tags */}
                    <Card className="h-fit">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Tag className="h-5 w-5 text-cyan-600" />
                          Classification
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <Badge 
                              variant={customer.customer_type === 'Residential' ? 'default' : 'secondary'}
                              className={`text-lg px-4 py-2 ${
                                customer.customer_type === 'Residential' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              }`}
                            >
                              {customer.customer_type === 'Residential' ? (
                                <Home className="h-4 w-4 mr-2" />
                              ) : (
                                <Building className="h-4 w-4 mr-2" />
                              )}
                              {customer.customer_type}
                            </Badge>
                          </div>
                          
                          {customer.tags && customer.tags.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-3">Tags</div>
                              <div className="flex flex-wrap gap-2">
                                {customer.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}