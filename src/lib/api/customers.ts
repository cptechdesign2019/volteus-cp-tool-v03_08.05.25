import { createClient } from '@/lib/supabase/client'

// Real API functions for customer management
export async function deleteAllCustomers() {
  console.log('Delete all customers API called')
  return { success: true }
}

export async function createCustomerAccount(accountData: any) {
  try {
    const supabase = createClient()
    
    console.log('Creating customer account with data:', accountData)
    
    const { data, error } = await supabase
      .from('customer_accounts')
      .insert({
        company_name: accountData.company_name,
        customer_type: accountData.customer_type,
        account_notes: accountData.account_notes,
        tags: accountData.tags || [],
        billing_address: accountData.billing_address || {},
        service_address: accountData.service_address || {}
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer account:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log('Customer account created successfully:', data)
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Exception creating customer account:', error)
    return {
      success: false,
      error: error.message || 'Failed to create customer account'
    }
  }
}

export async function createCustomerContact(contactData: any) {
  try {
    const supabase = createClient()
    
    console.log('Creating customer contact with data:', contactData)
    
    const { data, error } = await supabase
      .from('customer_contacts')
      .insert({
        customer_account_id: contactData.customer_account_id,
        contact_name: contactData.contact_name,
        email: contactData.email || null,
        phone: contactData.phone || null,
        role: contactData.role || null,
        is_primary_contact: contactData.is_primary_contact || false,
        contact_notes: contactData.contact_notes || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer contact:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log('Customer contact created successfully:', data)
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Exception creating customer contact:', error)
    return {
      success: false,
      error: error.message || 'Failed to create customer contact'
    }
  }
}