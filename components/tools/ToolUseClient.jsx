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
      <div className="py-8">
        <AuthPanel toolName={tool.title} onAuthenticated={() => setSession(true)} />
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-divider overflow-hidden bg-white h-[80vh]">
      {iframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
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
        className="w-full h-full border-0"
      />
    </div>
  )
}
