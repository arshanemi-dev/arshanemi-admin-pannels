'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const next = url.searchParams.get('next') || '/tools'

    getSupabaseBrowserClient().auth
      .exchangeCodeForSession(window.location.href)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(true)
        } else {
          router.replace(next)
        }
      })
      .catch(() => setError(true))
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {error ? (
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Sign-in failed</p>
          <p className="text-muted text-sm mb-4">Something went wrong completing your sign-in.</p>
          <a href="/tools" className="text-accent text-sm font-semibold hover:underline">
            Back to Tools
          </a>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent mx-auto mb-3 animate-spin" />
          <p className="text-muted text-sm">Signing you in…</p>
        </div>
      )}
    </div>
  )
}
