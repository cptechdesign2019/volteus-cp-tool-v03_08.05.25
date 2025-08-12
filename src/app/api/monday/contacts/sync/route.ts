import { NextRequest, NextResponse } from 'next/server'
import { fetchContacts } from '@/lib/monday'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Monday.com contacts sync...')
    
    // Fetch contacts from Monday.com
    const contacts = await fetchContacts()

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        message: 'No contacts found on Monday.com to sync.',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Fetched ${contacts.length} contacts from Monday.com`)

    // Get Supabase client with service role for upsert
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Add timestamp to all contacts
    const contactsWithTimestamp = contacts.map(contact => ({
      ...contact,
      last_synced_at: new Date().toISOString()
    }))

    // Upsert contacts to database
    const { data, error } = await supabase
      .from('contacts_monday')
      .upsert(contactsWithTimestamp, {
        onConflict: 'monday_item_id', // Primary key
        ignoreDuplicates: false, // Ensure updates happen
      })
      .select()

    if (error) {
      console.error('DATABASE UPSERT FAILED:', {
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint,
      })
      console.error('Data Sample Sent to DB:', JSON.stringify(contacts[0], null, 2));

      return NextResponse.json({ 
        success: false,
        error: 'Database upsert failed',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`Successfully synced ${data?.length || 0} contacts`)

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      timestamp: new Date().toISOString(),
    })
    
  } catch (err: any) {
    console.error('SYNC ROUTE ERROR:', err)
    
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}
