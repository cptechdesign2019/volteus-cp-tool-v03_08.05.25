import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all contacts ordered by most recently synced
    const { data, error } = await supabase
      .from('contacts_monday')
      .select('*')
      .order('last_synced_at', { ascending: false })

    if (error) {
      console.error("CONTACTS LIST ERROR:", error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: data || []
    })
    
  } catch (err: any) {
    console.error('LIST CONTACTS ERROR:', err)
    
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}
