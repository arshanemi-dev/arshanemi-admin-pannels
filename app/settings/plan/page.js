'use client'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { CoinsUsageTable, CoinPlansTable } from '@/components/admin/plan'
import { PromoBadge } from '@/components/admin/promo'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'
import { coinPlansNote } from '@/data/coinPlans'

// Groups tools' billable features into the shape CoinsUsageTable already
// expects (productName → tool title, variants[] → priced features) — see
// plan/my-payment-management.md §4/§6. Only tools with at least one active,
// priced feature show up; marketing-only tools (coinCost 0 / isActive false)
// don't clutter the rates table.
function buildUsageRateGroups(tools) {
  return tools
    .map((tool) => {
      const variants = (tool.features || [])
        .filter((f) => f.isActive && f.coinCost > 0)
        .map((f) => ({ name: f.title, fixFees: 0, coinCost: `${f.coinCost} Coin${f.coinCost === 1 ? '' : 's'}` }))
      return variants.length ? { id: tool.slug, productName: tool.title, variants } : null
    })
    .filter(Boolean)
}

export default function PlanPage() {
  const [packages, setPackages] = useState(null)
  const [tools, setTools] = useState(null)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    try {
      const [pkgRes, toolsRes] = await Promise.all([
        fetch('/api/wallet/packages'),
        fetch('/api/tools/my'),
      ])
      if (!pkgRes.ok || !toolsRes.ok) throw new Error()
      setPackages(await pkgRes.json())
      setTools(await toolsRes.json())
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Plan" description="Coins pricing per tool and coin recharge plans" />
      <PromoBadge />
      {error ? (
        <LoadError onRetry={load} />
      ) : !packages || !tools ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          <CoinPlansTable packages={packages} note={coinPlansNote} onPurchased={load} />
          <CoinsUsageTable data={buildUsageRateGroups(tools)} />
        </>
      )}
    </div>
  )
}
