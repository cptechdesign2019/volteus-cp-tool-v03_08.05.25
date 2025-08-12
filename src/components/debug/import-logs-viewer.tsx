'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2,
  Download,
  Eye,
  Copy as CopyIcon
} from 'lucide-react'
import ImportLogger from '@/lib/import-logger'

function ImportLogsViewer() {
  const [logs, setLogs] = React.useState(ImportLogger.getAllLogs())
  const [selectedLog, setSelectedLog] = React.useState<any>(null)
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copying' | 'copied'>('idle')

  const refreshLogs = () => {
    setLogs(ImportLogger.getAllLogs())
  }

  const clearLogs = () => {
    ImportLogger.clearLogs()
    setLogs([])
    setSelectedLog(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const downloadLogAsJson = (log: any) => {
    const dataStr = JSON.stringify(log, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `import-log-${log.id}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const copyLogToClipboard = async (log: any) => {
    setCopyStatus('copying')
    const logJson = JSON.stringify(log, null, 2)
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(logJson)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = logJson
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1500)
    } catch (err) {
      console.warn('Failed to copy log to clipboard', err)
      setCopyStatus('idle')
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            CSV Import Logs
          </h2>
          <p className="text-gray-600 mt-1">
            Debug CSV import issues with detailed import logs (last 10 imports)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshLogs} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Import Logs</p>
            <p>Import logs will appear here after CSV imports are attempted.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Imports</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLog?.id === log.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium text-sm truncate max-w-32">
                            {log.fileName}
                          </span>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div>
                          Success: {log.successfulRows}/{log.totalRows} rows
                        </div>
                        {log.errors.length > 0 && (
                          <div className="text-red-600">
                            {log.errors.length} error(s)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Log Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Import Details
                {selectedLog && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => copyLogToClipboard(selectedLog)}
                      variant="outline" 
                      size="sm"
                      title="Copy JSON to clipboard"
                      disabled={copyStatus === 'copying'}
                    >
                      <CopyIcon className="h-4 w-4 mr-1" />
                      {copyStatus === 'copying' ? 'Copying...' : copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button 
                      onClick={() => downloadLogAsJson(selectedLog)}
                      variant="outline" 
                      size="sm"
                      title="Download JSON file"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </CardTitle>
              {copyStatus === 'copied' && (
                <p className="text-sm text-green-600 mt-1">Copied to clipboard</p>
              )}
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {/* Summary */}
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">File:</span>
                          <p className="font-medium">{selectedLog.fileName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Rows:</span>
                          <p className="font-medium">{selectedLog.totalRows}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <p className="font-medium">
                            {selectedLog.successfulRows}/{selectedLog.totalRows} 
                            ({Math.round((selectedLog.successfulRows / selectedLog.totalRows) * 100)}%)
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Processing Time:</span>
                          <p className="font-medium">{selectedLog.processingTime}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Customer Type:</span>
                          <p className="font-medium">{selectedLog.customerType || 'Auto-detect'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* CSV Headers */}
                    <div>
                      <h4 className="font-medium mb-2">CSV Headers</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedLog.csvHeaders.map((header: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {header}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Sample Data */}
                    {selectedLog.sampleData && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2">Sample Processed Data</h4>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                            {JSON.stringify(selectedLog.sampleData, null, 2)}
                          </pre>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Errors */}
                    {selectedLog.errors.length > 0 && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2 text-red-600">
                            Errors ({selectedLog.errors.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLog.errors.map((error: string, index: number) => (
                              <div key={index} className="text-sm bg-red-50 p-2 rounded text-red-700">
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Warnings */}
                    {selectedLog.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-yellow-600">
                          Warnings ({selectedLog.warnings.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedLog.warnings.map((warning: string, index: number) => (
                            <div key={index} className="text-sm bg-yellow-50 p-2 rounded text-yellow-700">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select an import log to view details</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ImportLogsViewer