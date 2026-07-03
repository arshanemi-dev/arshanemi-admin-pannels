'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, User, ChevronRight } from 'lucide-react'
import { useToast } from './Toast'
import { clearAuthTokens } from '@/lib/tokenStore'

function buildBreadcrumb(pathname) {
  const parts = pathname.replace('/admin', '').split('/').filter(Boolean)
  if (!parts.length) return [{ label: 'Dashboard', href: '/admin' }]
  const crumbs = [{ label: 'Dashboard', href: '/admin' }]
  let path = '/admin'
  parts.forEach((p) => {
    path += `/${p}`
    const label = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
    crumbs.push({ label, href: path })
  })
  return crumbs
}

export default function Topbar({ username }) {
  const router = useRouter()
  const pathname = usePathname()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const crumbs = buildBreadcrumb(pathname)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    clearAuthTokens()
    addToast('Logged out successfully')
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            <span className={`text-sm truncate ${
              i === crumbs.length - 1
                ? 'font-semibold text-gray-900'
                : 'text-gray-400 hover:text-gray-600 cursor-pointer'
            }`}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* User chip */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-1.5 pr-3 py-1">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">{username || 'Admin'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loading ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </header>
  )
}
