'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Building, Home, Mail, Phone, MapPin, Eye } from 'lucide-react'

interface CustomerContact {
  id: string
  contact_name: string
  email: string
  phone: string
  role: string
  is_primary_contact: boolean
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
  customer_contacts?: CustomerContact[]
  contacts?: CustomerContact[] // From API search results
}

interface CustomerTableProps {
  customers: Customer[]
  isLoading?: boolean
  onCustomerClick: (customer: Customer) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  customerTypeFilter?: string // Added to determine header text
}

export function CustomerTable({ 
  customers, 
  isLoading = false, 
  onCustomerClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  customerTypeFilter,
  pageSize = 25
}: CustomerTableProps) {
  const formatAddress = (address?: any) => {
    if (!address) return null
    const parts = []
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    return parts.length > 0 ? parts.join(', ') : null
  }

  const getPrimaryContact = (contacts?: CustomerContact[]) => {
    if (!contacts || contacts.length === 0) return null
    return contacts.find(c => c.is_primary_contact) || contacts[0]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (customers.length === 0) {
    return null // Empty state will be handled by parent component
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%] text-center font-montserrat px-2 py-3">
                  {customerTypeFilter === 'Residential' ? 'Customer Name' : 'Company Name'}
                </TableHead>
                <TableHead className="w-[12%] text-center font-montserrat px-2 py-3">Type</TableHead>
                <TableHead className="w-[16%] text-center font-montserrat px-2 py-3">Primary Contact</TableHead>
                <TableHead className="w-[20%] text-center font-montserrat px-2 py-3">Contact Info</TableHead>
                <TableHead className="w-[16%] text-center font-montserrat px-2 py-3">Location</TableHead>
                <TableHead className="w-[8%] text-center font-montserrat px-2 py-3">Added</TableHead>
                <TableHead className="w-[8%] text-center font-montserrat px-2 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const primaryContact = getPrimaryContact(customer.contacts || customer.customer_contacts)
                const location = formatAddress(customer.billing_address)
                
                return (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onCustomerClick(customer)}
                  >
                    {/* Company Name */}
                    <TableCell className="font-montserrat px-2 py-3 text-center">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {customer.company_name}
                        </div>
                        {customer.account_notes && (
                          <div className="text-xs text-gray-500 truncate max-w-[250px]">
                            {customer.account_notes}
                          </div>
                        )}
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customer.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {customer.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{customer.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Customer Type */}
                    <TableCell className="text-center font-montserrat px-2 py-3">
                      <Badge 
                        variant={customer.customer_type === 'Residential' ? 'default' : 'secondary'}
                        className={
                          customer.customer_type === 'Residential' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                            : 'bg-clearpoint-cyan/10 text-clearpoint-cyan hover:bg-clearpoint-cyan/20 border-clearpoint-cyan/30'
                        }
                      >
                        {customer.customer_type === 'Residential' ? (
                          <Home className="h-3 w-3 mr-1" />
                        ) : (
                          <Building className="h-3 w-3 mr-1" />
                        )}
                        {customer.customer_type}
                      </Badge>
                    </TableCell>

                    {/* Primary Contact */}
                    <TableCell className="font-montserrat px-2 py-3 text-center">
                      {primaryContact ? (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {primaryContact.contact_name}
                          </div>
                          {primaryContact.role && (
                            <div className="text-xs text-gray-500">
                              {primaryContact.role}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No contact</span>
                      )}
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell className="font-montserrat px-2 py-3 text-center">
                      {primaryContact ? (
                        <div className="space-y-1">
                          {primaryContact.email && (
                            <div className="flex items-center justify-center text-xs text-gray-600">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="break-all">
                                {primaryContact.email}
                              </span>
                            </div>
                          )}
                          {primaryContact.phone && (
                            <div className="flex items-center justify-center text-xs text-gray-600">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {primaryContact.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="font-montserrat px-2 py-3 text-center">
                      {location ? (
                        <div className="flex items-center justify-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="truncate">{location}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Added Date */}
                    <TableCell className="text-center font-montserrat px-2 py-3">
                      <div className="text-sm text-gray-600">
                        {formatDate(customer.created_at)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center px-2 py-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCustomerClick(customer)
                        }}
                        className="h-8 w-8 p-0 hover:bg-clearpoint-coral/10"
                      >
                        <Eye className="h-4 w-4 text-clearpoint-coral hover:text-clearpoint-coral" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, customers.length)} of {customers.length} customers
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
              
              {totalPages > 5 && (
                <>
                  <span className="text-gray-400">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}