'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { WalletSummaryStats } from '@/components/admin/wallet'
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
  {
    key: 'userName', label: 'User', sortable: true,
    render: (v, row) => (
      <div>
        <p className="font-medium text-foreground">{v}</p>
        <p className="text-xs text-subtle">{row.userId}</p>
      </div>
    ),
  },
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

// wallet_topups.status is created|paid|failed|cancelled — the ledger UI only
// has three buckets (success/pending/failed), same as before this was wired.
function statusFor(topupStatus) {
  if (topupStatus === 'paid') return 'success'
  if (topupStatus === 'created') return 'pending'
  return 'failed'
}

// Admin cross-user ledger — real getAllUsageHistory + getAllWalletTopups,
// merged client-side into one ledger (see plan/my-payment-management.md §6).
// Both API routes already company-scope for the 'admin' role server-side, so
// no companyId handling is needed here.
export default function AdminWalletPage() {
  const [users, setUsers] = useState(null)
  const [transactions, setTransactions] = useState(null)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setUsers(null)
    setTransactions(null)
    try {
      const [usersRes, usageRes, topupsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/usage-history?limit=1000'),
        fetch('/api/admin/payment-history?limit=1000'),
      ])
      if (!usersRes.ok || !usageRes.ok || !topupsRes.ok) throw new Error()
      const [usersData, usage, topups] = await Promise.all([usersRes.json(), usageRes.json(), topupsRes.json()])

      const nameById = new Map(usersData.map((u) => [u.id, u.name]))
      const displayId = (id) => `#${id.slice(0, 8).toUpperCase()}`

      const usageRows = usage.map((u) => ({
        id: u.id,
        userId: displayId(u.userId),
        userName: nameById.get(u.userId) || 'Unknown',
        type: 'usage',
        description: `${prettifySlug(u.toolSlug)} — ${u.featureTitle || u.featureApiIdentifier}`,
        priceAmount: null,
        coins: -u.coinsCost,
        status: 'success',
        date: u.createdAt,
      }))
      const topupRows = topups.map((t) => ({
        id: t.id,
        userId: displayId(t.userId),
        userName: nameById.get(t.userId) || 'Unknown',
        type: 'topup',
        description: t.packageName,
        priceAmount: t.amountPaise / 100,
        coins: t.coinsGranted,
        status: statusFor(t.status),
        date: t.createdAt,
      }))

      setUsers(usersData)
      setTransactions([...usageRows, ...topupRows].sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <LoadError onRetry={load} />
  if (!users || !transactions) return <TableSkeleton />

  const balances = users.map((u) => ({
    total: u.wallet_credits_total ?? 0,
    used: u.wallet_credits_used ?? 0,
    remaining: Math.max(0, (u.wallet_credits_total ?? 0) - (u.wallet_credits_used ?? 0)),
  }))

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Wallet" description="Every customer's wallet balance and coin transaction history" />

      <WalletSummaryStats balances={balances} transactions={transactions} />

      <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
        <DataTable
          title="Transaction History"
          columns={columns}
          data={transactions}
          searchKeys={['userName', 'userId', 'description']}
          filters={[TYPE_FILTER, STATUS_FILTER]}
          dateKey="date"
          pageSize={10}
          emptyText="No transactions found."
        />
      </div>
    </div>
  )
}
