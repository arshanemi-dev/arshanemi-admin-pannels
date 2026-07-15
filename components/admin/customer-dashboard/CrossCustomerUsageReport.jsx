'use client'
import { useEffect, useState } from 'react'
import DataTable from '@/components/admin/data-table'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

function prettifySlug(slug) {
  return (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const columns = [
  { key: 'tool', label: 'Tool', sortable: true },
  { key: 'feature', label: 'Feature', sortable: true },
  {
    key: 'totalCoins', label: 'Total Coins Used', sortable: true,
    render: (v) => <span className="font-semibold text-foreground">{v.toLocaleString('en-IN')}</span>,
  },
  { key: 'fireCount', label: 'Times Used', sortable: true, render: (v) => v.toLocaleString('en-IN') },
  { key: 'uniqueUsers', label: 'Unique Users', sortable: true },
]

// Report #1 from "Customer Dashboard — clarified scope": tools/features-wise
// coins usage aggregated across every customer this viewer can see (a
// company-scoped 'admin' only sees their own company's users — enforced
// server-side by GET /api/admin/usage-history?groupBy=feature, same scoping
// as CustomerDashboardTable). See plan/my-payment-management.md §6 item 2.
export default function CrossCustomerUsageReport() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setRows(null)
    try {
      const res = await fetch('/api/admin/usage-history?groupBy=feature')
      if (!res.ok) throw new Error()
      const grouped = await res.json()
      setRows(
        grouped.map((g) => ({
          id: `${g.toolSlug}::${g.featureApiIdentifier}`,
          tool: prettifySlug(g.toolSlug),
          feature: g.featureTitle || g.featureApiIdentifier,
          totalCoins: g.totalCoins,
          fireCount: g.fireCount,
          uniqueUsers: g.uniqueUsers,
        }))
      )
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8 flex flex-col gap-4">
      {error ? (
        <LoadError onRetry={load} />
      ) : !rows ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          title="Tools & Features Usage"
          columns={columns}
          data={rows}
          searchKeys={['tool', 'feature']}
          pageSize={10}
          exportFileName="tools-usage-report"
          emptyText="No tool usage recorded yet."
        />
      )}
    </div>
  )
}
