// Simple test for RPC function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testRPC() {
  console.log('🧪 Testing generate_quote_number RPC function...')
  
  try {
    const { data, error } = await supabase.rpc('generate_quote_number')
    
    console.log('✅ RPC Result:', { data, error })
    
    if (error) {
      console.error('❌ RPC Error:', error)
    } else {
      console.log('✅ Generated quote number:', data)
    }
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

testRPC()
