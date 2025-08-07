'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload } from 'lucide-react'
import { CustomerCSVImport } from '../csv/customer-csv-import'

interface CustomerCsvImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CustomerCsvImportModal({ isOpen, onClose, onSuccess }: CustomerCsvImportModalProps) {
  const handleImportSuccess = (result: any) => {
    if (onSuccess) onSuccess()
    onClose()
  }

  const handleImportError = (error: string) => {
    console.error('CSV import error:', error)
    // Error is handled within the CustomerCSVImport component
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-y-auto">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Import Customer Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-0">
          <CustomerCSVImport
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}