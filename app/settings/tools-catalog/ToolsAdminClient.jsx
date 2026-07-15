'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, ExternalLink, ArrowLeft, Link2, Lock } from 'lucide-react'
import Link from 'next/link'

const TOOL_CATEGORIES = [
  { id: 'research',   label: 'Research Tools' },
  { id: 'analytics',  label: 'Analytics Tools' },
  { id: 'listing',    label: 'Listing Tools' },
  { id: 'embedded',   label: 'Embedded Tools' },
]

const ICON_OPTIONS = [
  'Search', 'Eye', 'Calculator', 'Tag', 'LineChart', 'TrendingUp',
  'BarChart3', 'Package', 'DollarSign', 'Target', 'Zap', 'Globe',
  'Wrench', 'Star', 'ShieldCheck',
]

const EMPTY_FORM = {
  slug: '', title: '', icon: 'Search', shortDesc: '', category: 'research', badge: '',
  toolUrl: '', requiresLogin: false, features: [],
}

function isValidUrl(value) {
  if (!value) return true // optional field
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
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
  const [urlError, setUrlError]   = useState('')

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setUrlError('')
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
      toolUrl: tool.toolUrl || '',
      requiresLogin: !!tool.requiresLogin,
      features: tool.features || [],
    })
    setUrlError('')
    setShowForm(true)
  }

  function autoSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function addFeature() {
    setForm((f) => ({
      ...f,
      features: [
        ...(f.features || []),
        { id: `feature-${Date.now()}`, icon: 'Star', title: '', desc: '', apiIdentifier: '', coinCost: 0, isActive: false },
      ],
    }))
  }

  function updateFeature(index, key, value) {
    setForm((f) => {
      const features = [...f.features]
      const row = { ...features[index], [key]: value }
      if (key === 'title') row.id = autoSlug(value) || row.id
      features[index] = row
      return { ...f, features }
    })
  }

  function removeFeature(index) {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast('Title and slug are required', 'error'); return
    }
    if (!isValidUrl(form.toolUrl)) {
      setUrlError('Enter a valid http:// or https:// URL')
      return
    }
    for (const feature of form.features || []) {
      if (feature.isActive && (!feature.apiIdentifier?.trim() || !(+feature.coinCost > 0))) {
        showToast(`"${feature.title || 'Untitled feature'}" is Active but needs an API Identifier and a Coin Cost above 0`, 'error')
        return
      }
    }
    setLoading(true)
    try {
      const url = editing
        ? `/api/admin/tools/${editing}`
        : '/api/admin/tools'
      const method = editing ? 'PUT' : 'POST'
      const body = {
        ...form,
        features: (form.features || []).map((f) => ({
          ...f,
          coinCost: Math.max(0, +f.coinCost || 0),
          apiIdentifier: f.apiIdentifier?.trim() || null,
        })),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <Link href="/settings" className="text-subtle hover:text-muted">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tools</h2>
            <p className="text-subtle text-sm mt-0.5">{tools.length} tools total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/tools" target="_blank" className="flex items-center gap-1.5 text-sm text-subtle hover:text-muted border border-divider rounded-xl px-3 py-2">
            <ExternalLink className="w-3.5 h-3.5" /> Preview
          </Link>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
        <input
          type="text"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-divider rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Tools Table */}
      <div className="bg-card rounded-2xl border border-divider overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-subtle">
            <p className="text-sm">No tools found. Click "Add Tool" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider bg-surface">
                <th className="text-left px-5 py-3 text-xs font-semibold text-subtle uppercase tracking-wider">Tool</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-subtle uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-subtle uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-subtle uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((tool) => (
                <tr key={tool.id} className="hover:bg-surface transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-accent text-xs font-bold">{tool.icon?.[0] || 'T'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-foreground">{tool.title}</p>
                          {tool.toolUrl && (
                            <span title="Embeddable — has a Use Tool link">
                              <Link2 className="w-3 h-3 text-accent" />
                            </span>
                          )}
                          {tool.requiresLogin && (
                            <span title="Requires login">
                              <Lock className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-subtle text-xs line-clamp-1 max-w-xs">{tool.shortDesc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-subtle font-mono text-xs hidden md:table-cell">
                    {tool.slug}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="bg-accent/10 text-accent-hover text-xs font-medium px-2.5 py-1 rounded-full">
                      {TOOL_CATEGORIES.find((c) => c.id === tool.category)?.label || tool.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        target="_blank"
                        className="p-1.5 text-subtle hover:text-muted rounded-lg hover:bg-surface"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openEdit(tool)}
                        className="p-1.5 text-subtle hover:text-accent rounded-lg hover:bg-accent/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        disabled={deletingId === tool.id}
                        className="p-1.5 text-subtle hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-divider">
              <h3 className="text-lg font-bold text-foreground">
                {editing ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-subtle hover:text-muted text-xl">×</button>
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

              <FormField label="Tool URL (optional — embeds this tool in an iframe)">
                <input
                  value={form.toolUrl}
                  onChange={(e) => setForm((f) => ({ ...f, toolUrl: e.target.value }))}
                  onBlur={() => setUrlError(isValidUrl(form.toolUrl) ? '' : 'Enter a valid http:// or https:// URL')}
                  placeholder="https://your-tool-app.example.com"
                  className="admin-input"
                />
                {urlError ? (
                  <p className="text-xs text-red-500 mt-1">{urlError}</p>
                ) : (
                  <p className="text-xs text-subtle mt-1">
                    When set, a "Use Tool" button appears on the tools grid and detail page, opening this URL in an iframe. The target site must allow iframe embedding.
                  </p>
                )}
              </FormField>

              <div className="flex items-center justify-between rounded-xl border border-divider px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-muted">Require Login</p>
                  <p className="text-xs text-subtle">Visitors must sign in before the embedded tool loads.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.requiresLogin}
                  onClick={() => setForm((f) => ({ ...f, requiresLogin: !f.requiresLogin }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    form.requiresLogin ? 'bg-accent' : 'bg-divider-light'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${
                      form.requiresLogin ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Features & Pricing — coinCost/isActive per feature (plan/my-payment-management.md §6 item 3).
                  Title/icon/desc are editable too since this is the only place features can be
                  authored past the initial seed; apiIdentifier is what POST /api/wallet/deduct matches on. */}
              <div className="rounded-xl border border-divider">
                <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
                  <div>
                    <p className="text-sm font-medium text-muted">Features & Pricing</p>
                    <p className="text-xs text-subtle">Active features are billable — external tool apps deduct coins against them.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Feature
                  </button>
                </div>

                {(form.features || []).length === 0 ? (
                  <p className="text-xs text-subtle px-4 py-4">No features yet.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-divider">
                    {form.features.map((feature, index) => (
                      <div key={feature.id || index} className="p-4 flex flex-col gap-3">
                        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                          <input
                            value={feature.title}
                            onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            placeholder="Feature title"
                            className="admin-input"
                          />
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="p-2 text-subtle hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <textarea
                          value={feature.desc}
                          onChange={(e) => updateFeature(index, 'desc', e.target.value)}
                          placeholder="Feature description"
                          rows={2}
                          className="admin-input resize-none"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={feature.icon}
                            onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                            className="admin-input"
                          >
                            {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                          <input
                            value={feature.apiIdentifier || ''}
                            onChange={(e) => updateFeature(index, 'apiIdentifier', e.target.value)}
                            placeholder="API identifier (e.g. crop-batch)"
                            className="admin-input font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-subtle">Coin Cost</label>
                            <input
                              type="number"
                              min={0}
                              value={feature.coinCost}
                              onChange={(e) => updateFeature(index, 'coinCost', e.target.value)}
                              className="admin-input"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <label className="text-xs text-subtle">Active</label>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={feature.isActive}
                              onClick={() => updateFeature(index, 'isActive', !feature.isActive)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                                feature.isActive ? 'bg-accent' : 'bg-divider-light'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${
                                  feature.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-divider text-muted font-medium py-2.5 rounded-xl text-sm hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
          border: 1px solid var(--color-divider);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          background: var(--color-card);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.12);
        }
      `}</style>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}
