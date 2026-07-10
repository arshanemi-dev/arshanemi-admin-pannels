'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Star } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

export default function TestimonialsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/testimonials').then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [])

  async function handleDelete(item) {
    setDeleting(true)
    await fetch(`/api/admin/testimonials/${item.id}`, { method: 'DELETE' })
    addToast(`"${item.name}" deleted`)
    setData((d) => d.filter((i) => i.id !== item.id))
    setDeleting(false); setConfirm(null)
  }

  const columns = [
    {
      key: 'avatar', label: '',
      render: (v, row) => v
        ? <img src={v} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
        : <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">{row.name?.[0]}</div>,
    },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'role', label: 'Role' },
    { key: 'company', label: 'Company', sortable: true },
    {
      key: 'rating', label: 'Rating',
      render: (v) => <div className="flex">{Array.from({ length: v || 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</div>,
    },
  ]

  return (
    <>
      <PageHeader title="Testimonials" newHref="/settings/testimonials/new" />
      {loading ? <div className="text-subtle text-sm">Loading…</div> : (
        <DataTable columns={columns} data={data} searchKeys={['name', 'company']}
          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <Link href={`/settings/testimonials/${row.id}`} className="p-1.5 rounded-lg text-subtle hover:text-accent hover:bg-accent/10"><Edit className="w-4 h-4" /></Link>
              <button onClick={() => setConfirm(row)} className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        />
      )}
      <ConfirmDialog open={!!confirm} title={`Delete "${confirm?.name}"?`} description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={deleting} />
    </>
  )
}
