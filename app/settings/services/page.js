'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function ServicesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const { addToast } = useToast()

  function load() {
    setError(false)
    setLoading(true)
    fetch('/api/admin/services')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(load, [])

  async function handleDelete(item) {
    setDeleting(item.id)
    const res = await fetch(`/api/admin/services/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      addToast(`"${item.title}" deleted`)
      setData((d) => d.filter((i) => i.id !== item.id))
    } else {
      addToast('Delete failed', 'error')
    }
    setDeleting(null)
    setConfirm(null)
  }

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'icon', label: 'Icon',
      render: (v) => <span className="text-xs bg-surface text-muted px-2 py-1 rounded font-mono">{v}</span>,
    },
  ]

  return (
    <>
      <PageHeader title="Services" description="Manage your service offerings" newHref="/settings/services/new" />
      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <LoadError onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={['title', 'slug', 'category']}
          actions={(row) => (
            <div className="flex items-center gap-2 justify-end">
              <Link href={`/settings/services/${row.id}`}
                className="p-1.5 rounded-lg text-subtle hover:text-accent hover:bg-accent/10 transition-colors">
                <Edit className="w-4 h-4" />
              </Link>
              <button onClick={() => setConfirm(row)}
                className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.title}"?`}
        description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={!!deleting}
      />
    </>
  )
}
