'use client'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ToolCoinTable from './ToolCoinTable'
import UsageHistoryTable from './UsageHistoryTable'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

const COIN_USE_RANGES = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'all-time', label: 'All Time' },
]

function prettifySlug(slug) {
  return (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Real date-range filtering (unlike the old dummy slice-based ranges, these
// use tools_usage_history.created_at directly, so they never go stale).
// Total, per-tool breakdown, and the history table below all derive from the
// same fetched list — one source of truth, per plan/my-payment-management.md.
function getUsageForRange(history, rangeId) {
  const now = new Date()
  const filtered = history.filter((h) => {
    if (rangeId === 'all-time') return true
    const d = new Date(h.createdAt)
    if (rangeId === 'this-month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth()
  })

  const total = filtered.reduce((sum, h) => sum + h.coinsCost, 0)

  const byTool = new Map()
  for (const h of filtered) {
    const name = prettifySlug(h.toolSlug)
    byTool.set(name, (byTool.get(name) ?? 0) + h.coinsCost)
  }
  const tools = [...byTool.entries()].map(([name, coinUse]) => ({ name, coinUse }))

  const events = filtered.map((h) => ({
    id: h.id,
    date: h.createdAt,
    tool: prettifySlug(h.toolSlug),
    feature: h.featureTitle || h.featureApiIdentifier,
    coins: h.coinsCost,
  }))

  return { total, tools, events }
}

// "Coin Use" tab content for the plain 'user' role — a Time-range filter
// driving a Total figure, a per-tool coin breakdown, and the individual
// usage events behind it, all from one GET /api/wallet/history/usage call.
export default function CoinUsagePanel() {
  const [range, setRange] = useState(COIN_USE_RANGES[0].id)
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setHistory(null)
    try {
      const res = await fetch('/api/wallet/history/usage?limit=1000')
      if (!res.ok) throw new Error()
      setHistory(await res.json())
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <LoadError onRetry={load} />
  if (!history) return <TableSkeleton rows={4} />

  const { total, tools, events } = getUsageForRange(history, range)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground">Time</label>
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-divider bg-surface pl-4 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {COIN_USE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground">Total</label>
          <div className="w-full rounded-xl border border-divider bg-surface px-4 py-3 text-sm text-foreground">
            {total}
          </div>
        </div>
      </div>

      <ToolCoinTable tools={tools} />
      <UsageHistoryTable events={events} />
    </div>
  )
}
