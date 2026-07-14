'use client'
import DataTable from '@/components/admin/DataTable'
import WalletBalanceCard from './WalletBalanceCard'
import { myWalletHistory } from '@/data/myWalletHistory'

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
    key: 'amount', label: 'Amount', sortable: true,
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

// "Wallet" tab on the Profile page — real balance from /api/auth/me, dummy
// own-transaction history (via the shared DataTable) until
// tools_usage_history/wallet_topups exist.
export default function UserWalletPanel({ profile }) {
  const total = profile.walletCreditsTotal ?? 0
  const used = profile.walletCreditsUsed ?? 0
  const remaining = profile.walletCreditsRemaining ?? Math.max(0, total - used)

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <WalletBalanceCard total={total} used={used} remaining={remaining} />
      <DataTable
        title="Transaction History"
        columns={columns}
        data={myWalletHistory}
        filters={[TYPE_FILTER, STATUS_FILTER]}
        dateKey="date"
        pageSize={5}
        emptyText="No transactions yet."
      />
    </div>
  )
}
