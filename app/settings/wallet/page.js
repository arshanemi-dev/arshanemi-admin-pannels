'use client'
import DataTable from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { WalletSummaryStats } from '@/components/admin/wallet'
import { walletBalances } from '@/data/walletBalances'
import { walletHistory } from '@/data/walletHistory'

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

export default function AdminWalletPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <PageHeader title="Wallet" description="Every customer's wallet balance and credit transaction history" />

      <WalletSummaryStats balances={walletBalances} />

      <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
        <DataTable
          title="Transaction History"
          columns={columns}
          data={walletHistory}
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
