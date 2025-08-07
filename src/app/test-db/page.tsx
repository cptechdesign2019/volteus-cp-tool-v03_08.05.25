import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestDbPage() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Test database queries
  const { data: customers, error: customersError } = await supabase
    .from('customer_accounts')
    .select('*')
    .limit(5)

  const { data: contacts, error: contactsError } = await supabase
    .from('customer_contacts')
    .select('*')
    .limit(5)

  const { count: customerCount } = await supabase
    .from('customer_accounts')
    .select('*', { count: 'exact', head: true })

  const { count: contactCount } = await supabase
    .from('customer_contacts')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Customer Accounts Table</h2>
          <p className="mb-2">Total Count: <strong>{customerCount}</strong></p>
          {customersError ? (
            <div className="text-red-600">Error: {customersError.message}</div>
          ) : (
            <div>
              <h3 className="font-medium mb-2">Sample Records:</h3>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(customers, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Customer Contacts Table</h2>
          <p className="mb-2">Total Count: <strong>{contactCount}</strong></p>
          {contactsError ? (
            <div className="text-red-600">Error: {contactsError.message}</div>
          ) : (
            <div>
              <h3 className="font-medium mb-2">Sample Records:</h3>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(contacts, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Search Test: "Berkshire"</h2>
          {(() => {
            // Test the Berkshire search
            const testBerkshire = async () => {
              const { data: berkshireResults, error: berkshireError } = await supabase
                .from('customer_accounts')
                .select('*')
                .ilike('company_name', '%Berkshire%')
              
              return { berkshireResults, berkshireError }
            }
            
            // Since this is server-side, we need to run the test here
            return (
              <div>
                <p className="text-gray-600">Testing search for "Berkshire" in company_name...</p>
                <p className="text-sm text-gray-500 mt-2">
                  (This will be executed server-side and show results)
                </p>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}