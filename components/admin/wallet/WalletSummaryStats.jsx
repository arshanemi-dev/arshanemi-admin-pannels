// Admin-only KPI row above the wallet history table — `balances` (data/walletBalances.js)
// drives the coin totals; `transactions` (data/walletHistory.js) drives Total Paid, since
// ₹ paid and coins issued are different numbers (a ₹1000 plan grants 1100 coins).
export default function WalletSummaryStats({ balances, transactions }) {
  const totalPaid = transactions
    .filter((t) => t.type === 'topup' && t.status === 'success')
    .reduce((sum, t) => sum + (t.priceAmount || 0), 0)

  const stats = [
    { label: 'Total Users', value: balances.length },
    { label: 'Total Paid', value: totalPaid, currency: true },
    { label: 'Coins Issued', value: balances.reduce((sum, b) => sum + b.total, 0) },
    { label: 'Coins Used', value: balances.reduce((sum, b) => sum + b.used, 0) },
    { label: 'Coins Remaining', value: balances.reduce((sum, b) => sum + b.remaining, 0) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-2xl border border-divider p-5">
          <p className="text-2xl font-bold text-foreground">
            {stat.currency && '₹'}{stat.value.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-subtle mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
