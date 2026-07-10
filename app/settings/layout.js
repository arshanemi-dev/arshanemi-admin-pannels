import { redirect, notFound } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Sidebar from '@/components/admin/Sidebar'
import Topbar from '@/components/admin/Topbar'
import { ToastProvider } from '@/components/admin/Toast'

export const metadata = {
  title: 'Admin — Arshanemi',
  robots: { index: false },
}

// master_admin has no entry here — unrestricted access to every /settings/* path.
const ALLOWED_PREFIXES = {
  admin: ['/settings/users', '/settings/tools', '/settings/profile'],
  user: ['/settings/profile'],
}

const LANDING_PAGE = {
  admin: '/settings/users',
  user: '/settings/profile',
}

export default async function AdminLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Login page: render children only — no shell, no redirect loop
  if (pathname === '/settings/login') {
    return <ToastProvider>{children}</ToastProvider>
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')?.value || cookieStore.get('arshanemi-token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) redirect('/settings/login')

  const role = payload.role

  // Every role below master_admin only gets a fixed slice of the panel.
  // Landing on the bare dashboard sends them to their own home page; any
  // other page outside their allowlist is a 404 — they're logged in, just
  // not permitted here, so a login redirect would be the wrong signal.
  if (role !== 'master_admin') {
    if (pathname === '/settings') redirect(LANDING_PAGE[role] || '/settings/profile')
    const allowed = ALLOWED_PREFIXES[role] || []
    if (!allowed.some((prefix) => pathname.startsWith(prefix))) notFound()
  }

  // Plain 'user' role has exactly one page — no sidebar to navigate with.
  if (role === 'user') {
    return (
      <ToastProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-surface">
          <Topbar username={payload.name} />
          <main className="flex-1 overflow-y-auto flex justify-center">
            <div className="p-6 lg:p-8 w-full max-w-2xl">{children}</div>
          </main>
        </div>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      {/* Fixed full-viewport shell — nothing outside this scrolls */}
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar role={role} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar username={payload.name} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8 max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
