import { createClient } from '@/lib/supabase/client'

// Real API functions for customer management

/**
 * Get all customer accounts
 */
export async function getCustomerAccounts() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('customer_accounts')
      .select('*')
      .order('company_name', { ascending: true })
    
    if (error) {
      console.error('Error fetching customer accounts:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Exception fetching customer accounts:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch customer accounts'
    }
  }
}
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

export async function updateCustomerAccount(customerId: string, accountData: any) {
  try {
    const supabase = createClient()
    
    console.log('Updating customer account:', customerId, 'with data:', accountData)
    
    const updateData: any = {}
    if (accountData.company_name !== undefined) updateData.company_name = accountData.company_name
    if (accountData.customer_type !== undefined) updateData.customer_type = accountData.customer_type
    if (accountData.account_notes !== undefined) updateData.account_notes = accountData.account_notes
    if (accountData.tags !== undefined) updateData.tags = accountData.tags || []
    if (accountData.billing_address !== undefined) updateData.billing_address = accountData.billing_address || {}
    if (accountData.service_address !== undefined) updateData.service_address = accountData.service_address || {}
    
    const { data, error } = await supabase
      .from('customer_accounts')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer account:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log('Customer account updated successfully:', data)
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Exception updating customer account:', error)
    return {
      success: false,
      error: error.message || 'Failed to update customer account'
    }
  }
}

export async function updateCustomerContact(contactId: string, contactData: any) {
  try {
    const supabase = createClient()
    
    console.log('Updating customer contact:', contactId, 'with data:', contactData)
    
    const updateData: any = {}
    if (contactData.contact_name !== undefined) updateData.contact_name = contactData.contact_name
    if (contactData.email !== undefined) updateData.email = contactData.email || null
    if (contactData.phone !== undefined) updateData.phone = contactData.phone || null
    if (contactData.role !== undefined) updateData.role = contactData.role || null
    if (contactData.is_primary_contact !== undefined) updateData.is_primary_contact = contactData.is_primary_contact
    if (contactData.contact_notes !== undefined) updateData.contact_notes = contactData.contact_notes || null
    
    const { data, error } = await supabase
      .from('customer_contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer contact:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log('Customer contact updated successfully:', data)
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Exception updating customer contact:', error)
    return {
      success: false,
      error: error.message || 'Failed to update customer contact'
    }
  }
}