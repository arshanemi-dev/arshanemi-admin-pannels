'use client'
import { useEffect, useRef, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import WalletBalanceCard from './WalletBalanceCard'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

const TYPE_FILTER = {
  key: 'type',
  label: 'All Types',
  options: [
    { value: 'topup', label: 'Top-up' },
    { value: 'usage', label: 'Usage' },
  ],
}

const STATUS_FILTER = {
  key: 'status',
  label: 'All Status',
  options: [
    { value: 'success', label: 'Success' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ],
}

const STATUS_STYLES = {
  success: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

const columns = [
  { key: 'type', label: 'Type', sortable: true, render: (v) => (v === 'topup' ? 'Top-up' : 'Usage') },
  { key: 'description', label: 'Description' },
  {
    key: 'priceAmount', label: 'Amount', sortable: true,
    render: (v) => (v == null ? <span className="text-subtle">–</span> : `₹${v.toLocaleString('en-IN')}`),
  },
  {
    key: 'coins', label: 'Coins', sortable: true,
    render: (v) => (
      <span className={`font-semibold ${v > 0 ? 'text-green-600' : 'text-foreground'}`}>{v > 0 ? `+${v}` : v}</span>
    ),
  },
  {
    key: 'status', label: 'Status', sortable: true,
    render: (v) => (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[v] || STATUS_STYLES.pending}`}>{v}</span>
    ),
  },
  {
    key: 'date', label: 'Date', sortable: true,
    render: (v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  },
]

function prettifySlug(slug) {
  return (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusFor(topupStatus) {
  if (topupStatus === 'paid') return 'success'
  if (topupStatus === 'created') return 'pending'
  return 'failed'
}

// "Wallet" tab on the Profile page — real balance from /api/auth/me (passed
// in as `profile`) plus real own-transaction history from
// /api/wallet/history/usage + /api/wallet/history/topups, merged client-side.
export default function UserWalletPanel({ profile }) {
  const total = profile.walletCreditsTotal ?? 0
  const used = profile.walletCreditsUsed ?? 0
  const remaining = profile.walletCreditsRemaining ?? Math.max(0, total - used)

  const [transactions, setTransactions] = useState(null)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setTransactions(null)
    try {
      const [usageRes, topupsRes] = await Promise.all([
        fetch('/api/wallet/history/usage?limit=200'),
        fetch('/api/wallet/history/topups?limit=200'),
      ])
      if (!usageRes.ok || !topupsRes.ok) throw new Error()
      const [usage, topups] = await Promise.all([usageRes.json(), topupsRes.json()])

      const usageRows = usage.map((u) => ({
        id: u.id,
        type: 'usage',
        description: `${prettifySlug(u.toolSlug)} — ${u.featureTitle || u.featureApiIdentifier}`,
        priceAmount: null,
        coins: -u.coinsCost,
        status: 'success',
        date: u.createdAt,
      }))
      const topupRows = topups.map((t) => ({
        id: t.id,
        type: 'topup',
        description: t.packageName,
        priceAmount: t.amountPaise / 100,
        coins: t.coinsGranted,
        status: statusFor(t.status),
        date: t.createdAt,
      }))

      setTransactions([...usageRows, ...topupRows].sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  // Bounded recheck: if a top-up is still showing 'pending' (server-side
  // verify/webhook hasn't resolved it yet), poll /api/wallet/reconcile a few
  // times so the row can flip to success/failed without a manual refresh —
  // capped at 3 attempts per Wallet-tab visit (attemptsRef resets when this
  // component remounts, e.g. switching tabs and back). Not a backend
  // setInterval — this is ordinary client-side UI polling, scoped to one
  // component's lifecycle, which is the safe place for this pattern.
  const attemptsRef = useRef(0)
  useEffect(() => {
    if (!transactions) return
    const hasPending = transactions.some((t) => t.type === 'topup' && t.status === 'pending')
    if (!hasPending || attemptsRef.current >= 3) return

    const timer = setTimeout(async () => {
      attemptsRef.current += 1
      try { await fetch('/api/wallet/reconcile', { method: 'POST' }) } catch { /* next attempt (or the cron sweep) will catch it */ }
      load()
    }, 10_000)

    return () => clearTimeout(timer)
  }, [transactions])

  return (
    <div className="flex flex-col gap-6">
      <WalletBalanceCard total={total} used={used} remaining={remaining} />
      {error ? (
        <LoadError onRetry={load} />
      ) : !transactions ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          title="Transaction History"
          columns={columns}
          data={transactions}
          filters={[TYPE_FILTER, STATUS_FILTER]}
          dateKey="date"
          pageSize={5}
          emptyText="No transactions yet."
        />
      )}
    </div>
  )
}
