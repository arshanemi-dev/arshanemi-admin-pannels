'use client'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { isLoggedIn, getAccessToken, getRefreshToken, getStoredUser } from '@/lib/tokenStore'
import AuthPanel from './AuthPanel'

// Cross-app SSO handoff — an admin-panel session already logged in here
// shouldn't have to log in again inside the embedded tool. Since the iframe
// is a different origin, we can't write to its localStorage directly; the
// only channel is the iframe's own src URL. The tool app's own bootstrap
// (lib/tokenHandoff.js there) reads these params before its first auth
// check, writes them into its own localStorage, and strips them from the
// URL — see that file for the receiving half of this handoff.
function buildIframeSrc(toolUrl) {
  if (!toolUrl || typeof window === 'undefined' || !isLoggedIn()) return toolUrl
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  if (!accessToken || !refreshToken) return toolUrl
  try {
    const url = new URL(toolUrl)
    url.searchParams.set('lt_at', accessToken)
    url.searchParams.set('lt_rt', refreshToken)
    const user = getStoredUser()
    if (user) url.searchParams.set('lt_u', JSON.stringify(user))
    return url.toString()
  } catch {
    return toolUrl
  }
}

export default function ToolUseClient({ tool }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [iframeLoading, setIframeLoading] = useState(true)
  // null until computed client-side — the iframe never mounts with a bare
  // tool.toolUrl (no handoff) while we're still deciding whether to attach
  // the SSO params, so the tool app never loses the handoff to a race.
  const [iframeSrc, setIframeSrc] = useState(null)

  useEffect(() => {
    if (!tool.requiresLogin) return
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [tool.requiresLogin])

  useEffect(() => {
    setIframeSrc(buildIframeSrc(tool.toolUrl))
  }, [tool.toolUrl])

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
      {(iframeLoading || !iframeSrc) && (
        <div className="absolute inset-0 flex items-center justify-center bg-card min-h-[70vh] h-full">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}
      {/* iframeSrc stays null until buildIframeSrc() has decided whether to
          attach SSO handoff params — the tool app must never load without
          having had the chance to receive them. */}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title={tool.title}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIframeLoading(false)}
          className="block w-full h-max min-h-[70vh] h-full border-0"
        />
      )}
    </div>
  )
}
