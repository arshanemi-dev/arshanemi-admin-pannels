// Admin-only KPI row above the wallet history table — aggregates data/walletBalances.js.
export default function WalletSummaryStats({ balances }) {
  const stats = [
    { label: 'Total Users', value: balances.length },
    { label: 'Coins Issued', value: balances.reduce((sum, b) => sum + b.total, 0) },
    { label: 'Coins Used', value: balances.reduce((sum, b) => sum + b.used, 0) },
    { label: 'Coins Remaining', value: balances.reduce((sum, b) => sum + b.remaining, 0) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-2xl border border-divider p-5">
          <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString('en-IN')}</p>
          <p className="text-xs text-subtle mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
