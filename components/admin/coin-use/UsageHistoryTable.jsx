function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "Recent Activity" — the individual usage events behind the Tools Name /
// Coin Use totals above it, newest first.
export default function UsageHistoryTable({ events }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      <div className="rounded-2xl border border-divider overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-surface">
              <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">Date</th>
              <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">Tool</th>
              <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground">Feature</th>
              <th className="px-5 py-3.5 text-left text-sm font-bold text-foreground whitespace-nowrap">Coins Used</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-subtle">No usage in this period.</td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-t border-divider hover:bg-surface transition-colors">
                  <td className="px-5 py-3 text-sm text-muted whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-5 py-3 text-sm text-foreground font-medium whitespace-nowrap">{e.tool}</td>
                  <td className="px-5 py-3 text-sm text-muted">{e.feature}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-foreground whitespace-nowrap">-{e.coins} Coins</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
