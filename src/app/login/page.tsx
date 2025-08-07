'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/dashboard')
        } else {
          setIsCheckingAuth(false)
        }
      } catch (err) {
        console.error('Authentication check failed:', err)
        setIsCheckingAuth(false)
      }
    }
    checkUser()
  }, [supabase, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: { prompt: 'login', max_age: '0' },
        },
      })
      
      if (error) {
        console.error('OAuth Error:', error)
        setError('Failed to initiate Google sign in. Please try again.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen login-background flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen login-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-6 text-center pt-8 pb-2">
                           {/* Logo/Brand Section */}
                 <div className="space-y-3">
                   <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                     <span className="text-2xl font-bold text-white relative z-10">C</span>
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber/20"></div>
                   </div>
                   
                   <div>
                     <CardTitle className="text-4xl font-bold text-primary mb-2 tracking-tight">
                       Clearpoint
                     </CardTitle>
                     <CardDescription className="text-lg font-medium text-muted-foreground">
                       Technology + Design
                     </CardDescription>
                   </div>
                 </div>
          
          <div className="pt-2">
            <CardDescription className="text-muted-foreground">
              Sign in to access your AV management platform
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                </div>
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </div>
            )}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Secure access with your Google Workspace account
            </p>
          </div>
          
          {/* Footer */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              © 2025 Clearpoint Technology + Design
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}