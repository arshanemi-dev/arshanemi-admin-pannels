'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Lock, Globe, CheckCircle2, XCircle } from 'lucide-react'
import * as Icons from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

function ToolIcon({ name }) {
  const Icon = (name && Icons[name]) || Globe
  return <Icon className="w-4 h-4 text-indigo-600" />
}

export default function ToolHubPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const { addToast } = useToast()

  function load() {
    setError(false)
    setLoading(true)
    fetch('/api/admin/tool-hub')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(load, [])

  async function handleDelete(item) {
    setDeleting(item.id)
    const res = await fetch(`/api/admin/tool-hub/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      addToast(`"${item.name}" deleted`)
      setData((d) => d.filter((i) => i.id !== item.id))
    } else {
      addToast('Delete failed', 'error')
    }
    setDeleting(null)
    setConfirm(null)
  }

  const columns = [
    {
      key: 'icon', label: 'Icon',
      render: (v) => <ToolIcon name={v} />,
    },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'url', label: 'URL',
      render: (v) => <span className="truncate max-w-xs block text-xs text-gray-500">{v}</span>,
    },
    {
      key: 'enabled', label: 'Status',
      render: (v) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          v ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {v ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {v ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'requiresLogin', label: 'Login Required',
      render: (v) => v ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <Lock className="w-3 h-3" /> Yes
        </span>
      ) : (
        <span className="text-xs text-gray-400">No</span>
      ),
    },
    { key: 'order', label: 'Order', sortable: true },
  ]

  return (
    <>
      <PageHeader
        title="Tool Hub"
        description="Configure embeddable external tools shown on the public Tool Hub page"
        newHref="/admin/tool-hub/new"
      />
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <LoadError onRetry={load} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={['name', 'url']}
          emptyText="No tools configured yet. Click Add New to create one."
          actions={(row) => (
            <div className="flex items-center gap-2 justify-end">
              <Link href={`/admin/tool-hub/${row.id}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                <Edit className="w-4 h-4" />
              </Link>
              <button onClick={() => setConfirm(row)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.name}"?`}
        description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={!!deleting}
      />
    </>
  )
}
