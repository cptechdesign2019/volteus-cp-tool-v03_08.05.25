'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Users, Building, Mail, Phone, Loader2, AlertCircle } from 'lucide-react'

interface Contact {
  monday_item_id: number
  first_name: string | null
  last_name: string | null
  title: string | null
  company: string | null
  email: string | null
  phone: string | null
  type: string | null
  last_synced_at?: string
}

export function LeadsDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncNow = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/monday/contacts/sync', {
        method: 'POST'
      })
      const json = await res.json()
      
      if (!json.success) {
        throw new Error(json.error || 'Sync failed')
      }
      
      setLastSync(json.timestamp)
      await fetchContacts()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/monday/contacts/list')
      const json = await res.json()
      
      if (json.success) {
        setContacts(json.data || [])
      } else {
        throw new Error(json.error || 'Failed to fetch contacts')
      }
    } catch (e: any) {
      console.error('Failed to fetch contacts:', e)
      setError(e.message)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const getFullName = (contact: Contact) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`
    }
    return contact.first_name || contact.last_name || '—'
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads Management</h1>
          <p className="page-subtitle">
            Manage your leads and prospects from Monday.com and native sources.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={syncNow}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Monday.com
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Last Sync Info */}
      {lastSync && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">
            ✅ Last synced: {new Date(lastSync).toLocaleString()}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="monday" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="monday" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Monday.com Contacts
          </TabsTrigger>
          <TabsTrigger value="native" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Volteus Native
          </TabsTrigger>
        </TabsList>

        {/* Monday.com Tab */}
        <TabsContent value="monday" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-clearpoint-navy" />
                  Monday.com Contacts
                </span>
                <Badge variant="outline" className="text-clearpoint-navy">
                  {contacts.length} contacts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-clearpoint-platinum rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-clearpoint-slateGray" />
                  </div>
                  <h3 className="text-lg font-semibold text-clearpoint-navy mb-2">No contacts found</h3>
                  <p className="text-clearpoint-slateGray mb-4">
                    Click "Sync Monday.com" to load data from your Monday.com board
                  </p>
                  <Button onClick={syncNow} disabled={loading} className="btn-primary">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.monday_item_id} className="hover:bg-clearpoint-alabaster/50">
                          <TableCell className="font-medium text-clearpoint-navy">
                            {getFullName(contact)}
                          </TableCell>
                          <TableCell className="text-clearpoint-charcoal">
                            {contact.title || '—'}
                          </TableCell>
                          <TableCell className="text-clearpoint-charcoal">
                            {contact.company || '—'}
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-clearpoint-slateGray" />
                                <span className="text-clearpoint-charcoal">{contact.email}</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-clearpoint-slateGray" />
                                <span className="text-clearpoint-charcoal">{contact.phone}</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.type ? (
                              <Badge variant="outline" className="border-clearpoint-cyan text-clearpoint-cyan">
                                {contact.type}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Native Tab */}
        <TabsContent value="native" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-clearpoint-platinum rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-clearpoint-slateGray" />
                </div>
                <h3 className="text-xl font-semibold text-clearpoint-navy mb-3">
                  Volteus Native Leads
                </h3>
                <p className="text-clearpoint-slateGray mb-6 max-w-md mx-auto">
                  Native lead management will be available here. 
                  You'll be able to import CSV files and manage leads directly in Volteus.
                </p>
                <Button disabled className="btn-secondary opacity-50 cursor-not-allowed">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
