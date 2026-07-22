'use client'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { CoinsUsageTable, CoinPlansTable, FeatureActivationPanel } from '@/components/admin/plan'
import { PromoBadge } from '@/components/admin/promo'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'
import { coinPlansNote } from '@/data/coinPlans'
import { buildUsageRateGroups } from '@/lib/toolPricing'

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
          <FeatureActivationPanel tools={tools} onChanged={load} />
          <CoinsUsageTable data={buildUsageRateGroups(tools)} />
        </>
      )}
    </div>
  )
}
