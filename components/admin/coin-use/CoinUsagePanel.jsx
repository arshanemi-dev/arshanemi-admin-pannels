'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ToolCoinTable from './ToolCoinTable'
import UsageHistoryTable from './UsageHistoryTable'
import { COIN_USE_RANGES, getUsageForRange } from '@/data/coinUsage'

// "Coin Use" tab content for the plain 'user' role — a Time-range filter
// driving a Total figure, a per-tool coin breakdown, and the individual
// usage events behind it. Named CoinUsagePanel (not TokenUsagePanel)
// deliberately — "token" is reserved elsewhere in this codebase for JWT
// auth tokens.
export default function CoinUsagePanel() {
  const [range, setRange] = useState(COIN_USE_RANGES[0].id)
  const { total, tools, events } = getUsageForRange(range)

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
