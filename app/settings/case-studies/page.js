'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

export default function CaseStudiesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/case-studies').then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [])

  async function handleDelete(item) {
    setDeleting(true)
    await fetch(`/api/admin/case-studies/${item.id}`, { method: 'DELETE' })
    addToast(`Case study deleted`)
    setData((d) => d.filter((i) => i.id !== item.id))
    setDeleting(false); setConfirm(null)
  }

  const columns = [
    { key: 'title', label: 'Title', sortable: true,
      render: (v) => <span className="font-medium text-foreground block max-w-xs truncate">{v}</span> },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'service', label: 'Service' },
    { key: 'client', label: 'Client', sortable: true },
  ]

  return (
    <>
      <PageHeader title="Case Studies" newHref="/settings/case-studies/new" />
      {loading ? <div className="text-subtle text-sm">Loading…</div> : (
        <DataTable columns={columns} data={data} searchKeys={['title', 'client', 'industry']}
          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <Link href={`/settings/case-studies/${row.id}`} className="p-1.5 rounded-lg text-subtle hover:text-accent hover:bg-accent/10"><Edit className="w-4 h-4" /></Link>
              <button onClick={() => setConfirm(row)} className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
      )}
      <ConfirmDialog open={!!confirm} title="Delete case study?" description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={deleting} />
    </>
  )
}
