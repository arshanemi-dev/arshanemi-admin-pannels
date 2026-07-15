import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth'
import { ToastProvider } from '@/components/admin/Toast'
import ProfileContent from '@/components/profile/ProfileContent'

export const metadata = {
  title: 'My Profile',
  robots: { index: false },
}

// Public-facing profile page — where the plain 'user' role lands (no
// /settings sidebar for that role by design; see
// plan/my-payment-management.md). master_admin/admin keep using
// /settings/profile inside the full admin shell.
export default async function PublicProfilePage() {
  const user = await getUserFromCookies()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background pt-[120px] pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ToastProvider>
          <ProfileContent />
        </ToastProvider>
      </div>
    </div>
  )
}
