// Dummy coin usage for Settings → Profile → "Coin Use" tab (plain 'user'
// role). Replace with real tools_usage_history aggregates once that table
// exists (see plan/my-payment-management.md).
//
// Named coinUsage (not tokenUsage) deliberately — "token" is reserved
// elsewhere in this codebase for JWT auth tokens (lib/auth.js,
// lib/tokenStore.js, app/api/auth/*). Reusing it here for an unrelated
// concept (coin consumption) was a naming collision; see the "Naming"
// section in plan/my-payment-management.md.
export const COIN_USE_RANGES = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'all-time', label: 'All Time' },
]

// One flat, newest-first list of individual usage events — real tool
// names (matching data/customers.js's toolsUse and data/walletHistory.js's
// descriptions), not the original mockup's generic "Tool 1..6". Everything
// getUsageForRange() returns (the Total, the per-tool breakdown, and the
// history list itself) derives from this single array, so the numbers
// always agree with each other — no separately hand-tuned totals to drift
// out of sync with the events.
export const coinUsageHistory = [
  { id: 'cu1', date: '2026-07-14', tool: 'PDF Crop', feature: 'Crop With SKU', coins: 5 },
  { id: 'cu2', date: '2026-07-12', tool: 'Background Remove', feature: 'Batch Remove (up to 50 images)', coins: 5 },
  { id: 'cu3', date: '2026-07-10', tool: 'Link Generator', feature: 'Bulk Export', coins: 12 },
  { id: 'cu4', date: '2026-07-08', tool: 'PDF Crop', feature: 'Single Crop', coins: 1 },
  { id: 'cu5', date: '2026-07-05', tool: 'Listing', feature: 'Auto Listing Generator', coins: 8 },
  { id: 'cu6', date: '2026-07-02', tool: 'Profit-Loss', feature: 'Order P&L Report', coins: 15 },
  { id: 'cu7', date: '2026-06-28', tool: 'Background Remove', feature: 'Single Image', coins: 3 },
  { id: 'cu8', date: '2026-06-24', tool: 'Link Generator', feature: 'Image Link (Single)', coins: 2 },
  { id: 'cu9', date: '2026-06-20', tool: 'PDF Crop', feature: 'Batch Crop With SKU', coins: 10 },
  { id: 'cu10', date: '2026-06-15', tool: 'Listing', feature: 'Auto Listing Generator', coins: 6 },
  { id: 'cu11', date: '2026-06-10', tool: 'Profit-Loss', feature: 'Order P&L Report', coins: 15 },
  { id: 'cu12', date: '2026-06-05', tool: 'PDF Crop', feature: 'Single Crop', coins: 1 },
  { id: 'cu13', date: '2026-05-28', tool: 'Background Remove', feature: 'Batch Remove (up to 50 images)', coins: 5 },
  { id: 'cu14', date: '2026-05-20', tool: 'Link Generator', feature: 'Bulk Export', coins: 12 },
  { id: 'cu15', date: '2026-05-10', tool: 'Listing', feature: 'Auto Listing Generator', coins: 8 },
]

// Sliced (newest-first), not filtered against real elapsed time — a range
// genuinely filtered by today's date would go stale and empty out a couple
// months after this was written. Slicing keeps "This Month" / "Last Month"
// / "All Time" meaningfully different, and non-empty, indefinitely.
export function getUsageForRange(rangeId) {
  const sorted = [...coinUsageHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
  const events =
    rangeId === 'this-month' ? sorted.slice(0, 6)
    : rangeId === 'last-month' ? sorted.slice(6, 11)
    : sorted

  const total = events.reduce((sum, e) => sum + e.coins, 0)

  const byTool = new Map()
  for (const e of events) byTool.set(e.tool, (byTool.get(e.tool) ?? 0) + e.coins)
  const tools = [...byTool.entries()].map(([name, coinUse]) => ({ name, coinUse }))

  return { total, tools, events }
}
