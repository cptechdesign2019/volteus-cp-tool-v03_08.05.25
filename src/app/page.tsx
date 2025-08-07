'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard')
      } else {
        // User is not authenticated, redirect to login
        router.push('/login')
      }
    }
    
    checkAuthAndRedirect()
  }, [supabase, router])

  // Show loading while checking auth
  return (
    <div className="min-h-screen login-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
        <p className="text-white/80 font-medium">Loading...</p>
      </div>
    </div>
  )
}