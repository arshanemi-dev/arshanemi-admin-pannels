'use client'
import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { Lock, ArrowLeft, Loader2, Globe } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import AuthPanel from './AuthPanel'

function ToolIcon({ name, size = 22 }) {
  const Icon = LucideIcons[name] || Globe
  return <Icon size={size} />
}

export default function ToolHubClient({ tools }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [activeId, setActiveId] = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const activeTool = tools.find((t) => t.id === activeId) || null

  function openTool(tool) {
    setIframeLoading(true)
    setActiveId(tool.id)
  }

  if (tools.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-muted">No tools are configured yet. Check back soon.</p>
      </div>
    )
  }

  if (activeTool) {
    const locked = activeTool.requiresLogin && !session
    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setActiveId(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Tools
        </button>

        {locked ? (
          <div className="py-8">
            <AuthPanel toolName={activeTool.name} onAuthenticated={() => {}} />
          </div>
        ) : (
          <div className="relative rounded-2xl border border-divider overflow-hidden bg-white h-[80vh]">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            )}
            <iframe
              src={activeTool.url}
              title={activeTool.name}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setIframeLoading(false)}
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => {
        const locked = tool.requiresLogin && !session
        return (
          <button
            key={tool.id}
            onClick={() => openTool(tool)}
            className="group relative flex flex-col text-left bg-card border border-divider rounded-2xl p-6 hover:border-accent/40 card-glow transition-all duration-200"
          >
            {locked && (
              <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <Lock size={10} /> Login
              </span>
            )}

            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
              <ToolIcon name={tool.icon} />
            </div>

            <h3 className="text-foreground font-bold text-lg mb-2 group-hover:text-accent transition-colors">
              {tool.name}
            </h3>
            {tool.description && (
              <p className="text-muted text-sm leading-relaxed flex-1 mb-2">
                {tool.description}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
