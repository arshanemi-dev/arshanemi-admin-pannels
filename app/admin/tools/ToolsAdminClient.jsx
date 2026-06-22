'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const TOOL_CATEGORIES = [
  { id: 'research',   label: 'Research Tools' },
  { id: 'analytics',  label: 'Analytics Tools' },
  { id: 'listing',    label: 'Listing Tools' },
]

const ICON_OPTIONS = [
  'Search', 'Eye', 'Calculator', 'Tag', 'LineChart', 'TrendingUp',
  'BarChart3', 'Package', 'DollarSign', 'Target', 'Zap', 'Globe',
  'Wrench', 'Star', 'ShieldCheck',
]

const EMPTY_FORM = {
  slug: '', title: '', icon: 'Search', shortDesc: '', category: 'research', badge: '',
}

export default function ToolsAdminClient({ initialTools }) {
  const [tools, setTools]         = useState(initialTools || [])
  const [query, setQuery]         = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [loading, setLoading]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast]         = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(tool) {
    setEditing(tool.id)
    setForm({
      slug: tool.slug || '',
      title: tool.title || '',
      icon: tool.icon || 'Search',
      shortDesc: tool.shortDesc || '',
      category: tool.category || 'research',
      badge: tool.badge || '',
    })
    setShowForm(true)
  }

  function autoSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast('Title and slug are required', 'error'); return
    }
    setLoading(true)
    try {
      const url = editing
        ? `/api/admin/tools/${editing}`
        : '/api/admin/tools'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { showToast('Save failed', 'error'); return }
      const saved = await res.json()
      if (editing) {
        setTools((t) => t.map((x) => x.id === editing ? saved : x))
      } else {
        setTools((t) => [saved, ...t])
      }
      setShowForm(false)
      showToast(editing ? 'Tool updated!' : 'Tool created!')
    } catch {
      showToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tool? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/tools/${id}`, { method: 'DELETE' })
      setTools((t) => t.filter((x) => x.id !== id))
      showToast('Tool deleted')
    } catch {
      showToast('Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = tools.filter(
    (t) => t.title?.toLowerCase().includes(query.toLowerCase()) ||
           t.slug?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tools</h2>
            <p className="text-gray-500 text-sm mt-0.5">{tools.length} tools total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tools" target="_blank" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2">
            <ExternalLink className="w-3.5 h-3.5" /> Preview
          </Link>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No tools found. Click "Add Tool" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tool</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-600 text-xs font-bold">{tool.icon?.[0] || 'T'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{tool.title}</p>
                        <p className="text-gray-400 text-xs line-clamp-1 max-w-xs">{tool.shortDesc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 font-mono text-xs hidden md:table-cell">
                    {tool.slug}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {TOOL_CATEGORIES.find((c) => c.id === tool.category)?.label || tool.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openEdit(tool)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        disabled={deletingId === tool.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {deletingId === tool.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <FormField label="Title *">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: f.slug || autoSlug(e.target.value),
                  }))}
                  placeholder="e.g. Product Research Tool"
                  className="admin-input"
                />
              </FormField>

              <FormField label="Slug *">
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="product-research"
                  className="admin-input font-mono"
                />
              </FormField>

              <FormField label="Short Description">
                <textarea
                  value={form.shortDesc}
                  onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                  placeholder="One sentence describing this tool…"
                  rows={3}
                  className="admin-input resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Icon (Lucide)">
                  <select
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    className="admin-input"
                  >
                    {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </FormField>

                <FormField label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="admin-input"
                  >
                    {TOOL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Badge (optional)">
                <input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="e.g. New, Beta, Most Popular"
                  className="admin-input"
                />
              </FormField>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : (editing ? 'Update Tool' : 'Create Tool')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #111827;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-input:focus {
          outline: none;
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234,88,12,0.12);
        }
      `}</style>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
