'use client'

// Temporary stub component for testing
export function DeleteCustomerModal({ customer, isOpen, onClose, onSuccess }: any) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded">
        <h2 className="text-xl font-bold mb-4">Delete Customer</h2>
        <p>Delete: {customer?.company_name}?</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
          Close
        </button>
      </div>
    </div>
  )
}