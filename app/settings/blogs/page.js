'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

export default function BlogsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  async function load() {
    const res = await fetch('/api/admin/blogs')
    setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(item) {
    setDeleting(true)
    const res = await fetch(`/api/admin/blogs/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      addToast(`"${item.title}" deleted`)
      setData((d) => d.filter((i) => i.id !== item.id))
    } else {
      addToast('Delete failed', 'error')
    }
    setDeleting(false)
    setConfirm(null)
  }

  const columns = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (v) => <span className="max-w-xs truncate block">{v}</span>,
    },
    {
      key: 'category', label: 'Category',
      render: (v) => (
        <span className="text-xs bg-accent/10 text-accent-hover px-2 py-1 rounded-full font-medium">
          {v?.name || '—'}
        </span>
      ),
    },
    { key: 'author', label: 'Author', sortable: true },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          v === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {v || 'draft'}
        </span>
      ),
    },
    { key: 'date', label: 'Date', sortable: true },
  ]

  return (
    <>
      <PageHeader title="Blog Posts" description={`${data.length} posts`} newHref="/settings/blogs/new" />
      {loading ? (
        <div className="text-subtle text-sm">Loading…</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKeys={['title', 'author', 'status']}
          actions={(row) => (
            <div className="flex items-center gap-2 justify-end">
              <Link href={`/settings/blogs/${row.id}`}
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
        description="The blog post and its images will be permanently deleted."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </>
  )
}
