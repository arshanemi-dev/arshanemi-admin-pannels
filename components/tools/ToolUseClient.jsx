'use client'
import { useState, useEffect,useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { isLoggedIn, getAccessToken, getRefreshToken, getStoredUser } from '@/lib/tokenStore'

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
  const [iframeLoading, setIframeLoading] = useState(true)
  // null until computed client-side — the iframe never mounts with a bare
  // tool.toolUrl (no handoff) while we're still deciding whether to attach
  // the SSO params, so the tool app never loses the handoff to a race.
  const [iframeSrc, setIframeSrc] = useState(null)

  const iframeRef = useRef(null);

  const handleLoad = () => {
    if (iframeRef.current) {
      // Get height of inner content body
      const contentHeight = iframeRef.current.contentWindow?.document.body.scrollHeight;
      if (contentHeight) {
        iframeRef.current.style.height = `${contentHeight}px`;
      }
    }
  };

  useEffect(() => {
    setIframeSrc(buildIframeSrc(tool.toolUrl))
  }, [tool.toolUrl])

  return (
    // Same centered content container as ToolsNavbar (max-w-7xl mx-auto +
    // responsive px), not a viewport-escaping full-bleed hack — w-screen
    // (which includes the scrollbar's width on most browsers) only ever
    // pushed the iframe past the real viewport edge and caused horizontal
    // overflow. The iframe itself stays w-full so it fills that container
    // responsively at every breakpoint.
    <div className="relative  mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative w-full bg-white rounded-2xl border border-divider overflow-hidden">
        {(iframeLoading || !iframeSrc) && (
          <div className="absolute inset-0 flex items-center justify-center bg-card min-h-[90vh] h-full">
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
  /* Added allow-downloads and allow-modals below */
  sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
  allow="clipboard-write"
  referrerPolicy="no-referrer"
  loading="lazy"
  onLoad={() => {
    setIframeLoading(false);
    handleLoad();
  }}
  className="block w-full h-max min-h-[85vh] h-full border-0"
/>
        )}
      </div>
    </div>
  )
}
