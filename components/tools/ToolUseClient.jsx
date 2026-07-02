'use client'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import AuthPanel from './AuthPanel'

export default function ToolUseClient({ tool }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [iframeLoading, setIframeLoading] = useState(true)

  useEffect(() => {
    if (!tool.requiresLogin) return
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [tool.requiresLogin])

  const locked = tool.requiresLogin && !session

  if (tool.requiresLogin && session === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  if (locked) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuthPanel toolName={tool.title} onAuthenticated={() => setSession(true)} />
      </div>
    )
  }

  return (
    // Full-bleed: breaks out of the max-w-5xl page container to span the full viewport width.
    <div className="relative w-screen left-1/2 -translate-x-1/2 bg-white">
      {iframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card min-h-[70vh] h-full">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}
      <iframe
        src={tool.toolUrl}
        title={tool.title}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIframeLoading(false)}
        className="block w-full h-max min-h-[70vh] h-full border-0"
      />
    </div>
  )
}
