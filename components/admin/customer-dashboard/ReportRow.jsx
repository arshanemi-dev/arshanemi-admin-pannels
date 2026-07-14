'use client'
import { useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import UsageTrendChart from './UsageTrendChart'
import { TOOL_FILTER_OPTIONS, getUsageTrend } from '@/data/coinUsageTrend'

// One row of the Report drill-down: a period (preset label, or two date
// inputs for the custom row) + its own "Tools Wise" filter + a coins total +
// an inline curve chart. Each row owns its filter state independently — the
// mockup shows five simultaneous, differently-scoped views for one customer,
// not one filter bar governing all of them.
export default function ReportRow({ userId, range, isCustom = false }) {
  const [tool, setTool] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { totalCoins, points } = useMemo(
    () => getUsageTrend({ userId, tool, days: range?.days, from: isCustom ? from : undefined, to: isCustom ? to : undefined }),
    [userId, tool, range, isCustom, from, to]
  )

  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1fr)_80px_minmax(220px,2fr)] gap-4 items-center px-5 py-4 border-t border-divider">
      {isCustom ? (
        <div className="flex flex-col gap-2">
          {[['From', from, setFrom], ['To', to, setTo]].map(([label, value, setValue]) => (
            <div key={label} className="relative">
              <input
                type="date"
                aria-label={label}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-divider-light bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Calendar className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
            </div>
          ))}
        </div>
      ) : (
        <span className="text-sm font-semibold text-foreground">{range.label}</span>
      )}

      <select
        value={tool}
        onChange={(e) => setTool(e.target.value)}
        className="px-3 py-2 rounded-lg border border-divider-light bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {TOOL_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <span className="text-sm font-semibold text-foreground">{totalCoins === null ? '–' : totalCoins}</span>

      <UsageTrendChart points={points} />
    </div>
  )
}
