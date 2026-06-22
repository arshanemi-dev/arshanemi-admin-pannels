import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Sidebar from '@/components/admin/Sidebar'
import Topbar from '@/components/admin/Topbar'
import { ToastProvider } from '@/components/admin/Toast'

export const metadata = {
  title: 'Admin — Santhya Infotech',
  robots: { index: false },
}

export default async function AdminLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Login page: render children only — no shell, no redirect loop
  if (pathname === '/admin/login') {
    return <ToastProvider>{children}</ToastProvider>
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) redirect('/admin/login')

  return (
    <ToastProvider>
      {/* Fixed full-viewport shell — nothing outside this scrolls */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar username={payload.username} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8 max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
