// Total / Used / Remaining summary card — shared by the admin Wallet page
// (per-row context) and the personal Wallet tab (own balance).
export default function WalletBalanceCard({ total, used, remaining, title = 'Wallet Balance' }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

  return (
    <div className="bg-card rounded-2xl border border-divider p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">{title}</h2>
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
      <p className="text-[11px] text-subtle mt-2">{pct}% of coins used</p>
    </div>
  )
}
