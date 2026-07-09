'use client'
import { useEffect, useState } from 'react'
import { UserCircle, Mail, Phone, Building2, ShieldCheck, KeyRound, CalendarDays } from 'lucide-react'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'
import OtpPasswordResetModal from '@/components/admin/OtpPasswordResetModal'

const ROLE_LABELS = {
  master_admin: 'Master Admin',
  admin: 'Admin',
  user: 'User',
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-divider last:border-0">
      <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-subtle" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-subtle">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  async function load() {
    setError(false)
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error()
      setProfile(await res.json())
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <LoadError onRetry={load} />
  if (!profile) return <TableSkeleton rows={4} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-subtle">Your account details</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-divider p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-divider">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {profile.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{profile.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent-hover">
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                profile.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          {profile.email && <InfoRow icon={Mail} label="Email" value={profile.email} />}
          {profile.mobile && <InfoRow icon={Phone} label="Mobile" value={profile.mobile} />}
          {profile.companyName && <InfoRow icon={Building2} label="Company" value={profile.companyName} />}
          <InfoRow
            icon={ShieldCheck}
            label="Login OTP"
            value={profile.otpEnabled ? 'Required on every login' : 'Not required'}
          />
          {profile.createdAt && (
            <InfoRow icon={CalendarDays} label="Member since" value={new Date(profile.createdAt).toLocaleDateString()} />
          )}
        </div>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-divider-light text-sm font-medium text-muted py-2.5 hover:bg-surface transition-colors"
        >
          <KeyRound className="w-4 h-4" /> Change Password
        </button>
      </div>

      <OtpPasswordResetModal
        open={showPasswordModal}
        identifier={profile.email}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}
