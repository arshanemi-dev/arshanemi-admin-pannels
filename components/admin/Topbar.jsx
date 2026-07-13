'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { LogOut, User, ChevronRight, ExternalLink } from 'lucide-react'
import { useToast } from './Toast'
import { clearAuthTokens } from '@/lib/tokenStore'

function buildBreadcrumb(pathname) {
  const parts = pathname.replace('/settings', '').split('/').filter(Boolean)
  if (!parts.length) return [{ label: 'Dashboard', href: '/settings' }]
  const crumbs = [{ label: 'Dashboard', href: '/settings' }]
  let path = '/settings'
  parts.forEach((p) => {
    path += `/${p}`
    const label = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
    crumbs.push({ label, href: path })
  })
  return crumbs
}

export default function Topbar({ username, role }) {
  const pathname = usePathname()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const crumbs = buildBreadcrumb(pathname)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    clearAuthTokens()
    addToast('Logged out successfully')
    // Hard redirect (not router.push) so every server component re-renders
    // logged-out — client-side nav would leave stale authed state cached.
    window.location.href = '/'
  }

  return (
    <header className="flex-shrink-0 h-14 bg-card border-b border-divider flex items-center px-6 gap-4 z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-subtle flex-shrink-0" />}
            <span className={`text-sm truncate ${
              i === crumbs.length - 1
                ? 'font-semibold text-foreground'
                : 'text-subtle hover:text-muted cursor-pointer'
            }`}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Plain 'user' role has no sidebar, so no "View Website" link to
            find otherwise — surface it here instead. Plain <a>, not
            next/link — hard navigation back to the public site on purpose
            (see Sidebar.jsx's "View Website" for the same reasoning). */}
        {role === 'user' && (
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface hover:text-foreground border border-divider transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Main Site
          </a>
        )}

        {/* User chip */}
        <div className="flex items-center gap-2 bg-surface border border-divider rounded-full pl-1.5 pr-3 py-1">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-muted">{username || 'Admin'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 border border-divider hover:border-red-200 transition-all disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loading ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </header>
  )
}
