'use client'
import { useState, useEffect } from 'react'
import { Trash2, Plus, Save } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', slug: '', thumbnailBg: 'bg-gradient-to-br from-indigo-900/60 to-violet-800/40' })
  const [adding, setAdding] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/blog-categories').then((r) => r.json()).then((d) => { setCategories(d); setLoading(false) })
  }, [])

  async function handleDelete(cat) {
    setDeleting(true)
    const res = await fetch(`/api/admin/blog-categories/${cat.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      addToast(`"${cat.name}" deleted`)
      setCategories((c) => c.filter((i) => i.id !== cat.id))
    } else {
      addToast(data.error || 'Cannot delete', 'error')
    }
    setDeleting(false); setConfirm(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/admin/blog-categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCat),
    })
    const data = await res.json()
    if (res.ok) {
      addToast('Category created!')
      setCategories((c) => [data, ...c])
      setNewCat({ name: '', slug: '', thumbnailBg: 'bg-gradient-to-br from-indigo-900/60 to-violet-800/40' })
    } else {
      addToast(data.error || 'Failed', 'error')
    }
    setAdding(false)
  }

  return (
    <>
      <PageHeader title="Blog Categories" description="Manage category taxonomy" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-divider">
              {['Name', 'Slug', 'Thumbnail Bg Class', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-subtle uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-subtle">Loading…</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface">
                <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-subtle">{cat.slug}</td>
                <td className="px-4 py-3 text-xs text-subtle truncate max-w-xs">{cat.thumbnailBg}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setConfirm(cat)}
                    className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Inline add row */}
            <tr className="bg-accent/5">
              <td className="px-4 py-3">
                <input value={newCat.name}
                  onChange={(e) => setNewCat((n) => ({ ...n, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                  placeholder="Category name"
                  className="w-full text-sm border border-divider-light rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
              </td>
              <td className="px-4 py-3">
                <input value={newCat.slug}
                  onChange={(e) => setNewCat((n) => ({ ...n, slug: e.target.value }))}
                  placeholder="category-slug"
                  className="w-full text-sm border border-divider-light rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
              </td>
              <td className="px-4 py-3">
                <input value={newCat.thumbnailBg}
                  onChange={(e) => setNewCat((n) => ({ ...n, thumbnailBg: e.target.value }))}
                  placeholder="Tailwind gradient class"
                  className="w-full text-sm border border-divider-light rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={handleAdd} disabled={adding || !newCat.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium disabled:opacity-60 transition-colors ml-auto">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={!!confirm} title={`Delete "${confirm?.name}"?`}
        description="Make sure no blog posts use this category before deleting."
        onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={deleting} />
    </>
  )
}
