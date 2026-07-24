'use client'
import { usePathname } from 'next/navigation'
import Header from './Header'
import ToolsNavbar from './ToolsNavbar'
import SessionManager from '@/components/admin/SessionManager'
import WhatsAppFloat from '@/components/ui/WhatsAppFloat'
import LeadPopup from '@/components/ui/LeadPopup'

const AUTH_ONLY_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password']

// Decides Header/Footer visibility from the live client-side pathname
// (usePathname) rather than the server-computed x-pathname header that
// app/layout.js used to branch on directly. That header is only accurate for
// the request that produced the current RSC payload — Next's client Router
// Cache can reuse a layout's previously-rendered output across client-side
// navigations (pushes, redirects, and especially browser back/forward), so a
// server-computed hideChrome lagged behind the real URL: the Header would
// flash in on a redirect to /login, then stay wrongly hidden after going
// back. usePathname() always reflects the current URL immediately regardless
// of that caching, so it doesn't have this glitch.
export default function SiteChrome({ children, tools, company, footer }) {
  const pathname = usePathname() || ''
  const isAdmin = pathname.startsWith('/settings')
  const isToolsSection = pathname.startsWith('/tools')
  const hideChrome = isAdmin || AUTH_ONLY_PATHS.includes(pathname)

  if (hideChrome) return children

  return (
    <>
      <SessionManager loginPath="/login" redirectOnExpiry={false} />
      {isToolsSection ? (
        <ToolsNavbar tools={tools} />
      ) : (
        <Header tools={tools} />
      )}
      <main className="flex-1">{children}</main>
      {footer}
      <WhatsAppFloat whatsapp={company?.whatsapp} />
      <LeadPopup />
    </>
  )
}
