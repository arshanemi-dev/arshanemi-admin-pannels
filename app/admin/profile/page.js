'use client'
import { useEffect, useState } from 'react'
import {
  UserCircle, Mail, Phone, Building2, ShieldCheck, KeyRound, CalendarDays,
  MapPin, Pencil, CreditCard, Wallet,
} from 'lucide-react'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'
import OtpPasswordResetModal from '@/components/admin/OtpPasswordResetModal'
import EditProfileModal from './EditProfileModal'

const ROLE_LABELS = {
  master_admin: 'Master Admin',
  admin: 'Admin',
  user: 'User',
}

const SUBSCRIPTION_STATUS_STYLES = {
  active: 'bg-green-50 text-green-700',
  trialing: 'bg-blue-50 text-blue-700',
  past_due: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  inactive: 'bg-surface text-subtle',
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

function SubscriptionCard({ subscription }) {
  if (!subscription) return null
  const plan = subscription.planDetails
  const status = subscription.status || 'inactive'

  return (
    <div className="bg-card rounded-2xl border border-divider p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-foreground truncate">{plan?.name || subscription.plan || 'No plan'}</p>
          {plan && (
            <p className="text-xs text-subtle mt-0.5">
              {plan.price === 0 ? 'Free' : `₹${plan.price} / ${plan.interval}`}
            </p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${SUBSCRIPTION_STATUS_STYLES[status] || SUBSCRIPTION_STATUS_STYLES.inactive}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      {subscription.currentPeriodEnd && (
        <p className="text-xs text-subtle mt-3">
          {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

function WalletCard({ profile }) {
  const total = profile.walletCreditsTotal ?? 0
  const used = profile.walletCreditsUsed ?? 0
  const remaining = profile.walletCreditsRemaining ?? Math.max(0, total - used)
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

  return (
    <div className="bg-card rounded-2xl border border-divider p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">Wallet</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <p className="text-xl font-bold text-foreground">{total}</p>
          <p className="text-[11px] text-subtle mt-0.5">Total</p>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{used}</p>
          <p className="text-[11px] text-subtle mt-0.5">Used</p>
        </div>
        <div>
          <p className="text-xl font-bold text-accent">{remaining}</p>
          <p className="text-[11px] text-subtle mt-0.5">Remaining</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-subtle mt-2">{pct}% of credits used</p>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  async function load() {
    setError(false)
    try {
      const [profileRes, subRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/subscription').catch(() => null),
      ])
      if (!profileRes.ok) throw new Error()
      setProfile(await profileRes.json())
      setSubscription(subRes?.ok ? await subRes.json() : null)
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
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-divider">
          <div className="flex items-center gap-4 min-w-0">
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
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-divider-light text-sm font-medium text-muted px-3 py-2 hover:bg-surface transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        <div className="pt-2">
          {profile.email && <InfoRow icon={Mail} label="Email" value={profile.email} />}
          {profile.mobile && <InfoRow icon={Phone} label="Mobile" value={profile.mobile} />}
          {profile.address1 && <InfoRow icon={MapPin} label="Address 1" value={profile.address1} />}
          {profile.address2 && <InfoRow icon={MapPin} label="Address 2" value={profile.address2} />}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SubscriptionCard subscription={subscription} />
        <WalletCard profile={profile} />
      </div>

      <OtpPasswordResetModal
        open={showPasswordModal}
        identifier={profile.email}
        onClose={() => setShowPasswordModal(false)}
      />

      <EditProfileModal
        open={showEditModal}
        profile={profile}
        onClose={() => setShowEditModal(false)}
        onSaved={(updated) => { setProfile(updated); setShowEditModal(false) }}
      />
    </div>
  )
}
