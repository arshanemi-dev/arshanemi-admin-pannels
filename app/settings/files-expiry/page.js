'use client'
import { useEffect, useState, useCallback } from 'react'
import { Clock, Plus, Trash2, Pencil, X, Check, Loader2, AlertTriangle } from 'lucide-react'

function daysRemaining(expiryAt) {
  return Math.ceil((new Date(expiryAt) - new Date()) / 86400000)
}

function StatusBadge({ days }) {
  if (days <= 0) return <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">Expired</span>
  if (days <= 7) return <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Expiring in {days}d</span>
  return <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">{days}d left</span>
}

const EMPTY = { name: '', expiryAt: '' }

export default function FilesExpiryPage() {
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(new Set())
  const [modal, setModal]           = useState(null) // null | 'add' | 'editOne' | 'bulkExpiry'
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [addRows, setAddRows]       = useState([{ ...EMPTY }])
  const [bulkDate, setBulkDate]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/files-expiry')
    const data = await res.json()
    setRecords(data.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggleAll(e) {
    setSelected(e.target.checked ? new Set(records.map(r => r.id)) : new Set())
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleDelete(ids) {
    if (!confirm(`Delete ${ids.length} record(s)?`)) return
    await fetch('/api/admin/files-expiry/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setSelected(new Set())
    load()
  }

  function openAdd() {
    setAddRows([{ ...EMPTY }])
    setError('')
    setModal('add')
  }

  function openEditOne(r) {
    setEditTarget(r)
    setForm({ name: r.name, expiryAt: r.expiry_at.slice(0, 10) })
    setError('')
    setModal('editOne')
  }

  function openBulkExpiry() {
    setBulkDate('')
    setError('')
    setModal('bulkExpiry')
  }

  async function handleAdd() {
    setError('')
    for (const row of addRows) {
      if (!row.name.trim() || !row.expiryAt) { setError('Each row needs a name and expiry date'); return }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/files-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: addRows.map(r => ({ name: r.name.trim(), expiryAt: new Date(r.expiryAt).toISOString() })) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  async function handleEditOne() {
    setError('')
    if (!form.name.trim() || !form.expiryAt) { setError('Name and expiry date are required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/files-expiry/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), expiryAt: new Date(form.expiryAt).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  async function handleBulkExpiry() {
    setError('')
    if (!bulkDate) { setError('Select an expiry date'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/files-expiry/bulk-expiry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], expiryAt: new Date(bulkDate).toISOString() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      setSelected(new Set())
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  const allChecked = records.length > 0 && selected.size === records.length
  const someChecked = selected.size > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Files Expiry</h1>
            <p className="text-sm text-subtle">Track and manage file expiry dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {someChecked && (
            <>
              <button
                onClick={openBulkExpiry}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-accent/30 text-accent-hover bg-accent/10 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                Edit Expiry ({selected.size})
              </button>
              <button
                onClick={() => handleDelete([...selected])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete ({selected.size})
              </button>
            </>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Files
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-subtle">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-subtle" />
          <p className="font-medium">No files tracked yet</p>
          <p className="text-sm">Click "Add Files" to start tracking expiry dates</p>
        </div>
      ) : (
        <div className="border border-divider rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-divider">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Expiry Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {records.map(r => {
                const days = daysRemaining(r.expiry_at)
                return (
                  <tr key={r.id} className={selected.has(r.id) ? 'bg-accent/10' : 'hover:bg-surface'}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground truncate max-w-xs">{r.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(r.expiry_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge days={days} /></td>
                    <td className="px-4 py-3 text-subtle">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditOne(r)}
                          className="p-1.5 rounded-lg hover:bg-surface text-subtle hover:text-accent transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete([r.id])}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-subtle hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Files */}
      {modal === 'add' && (
        <Modal title="Add Files to Track" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {addRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="File name or path"
                  value={row.name}
                  onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                  className="flex-1 border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="date"
                  value={row.expiryAt}
                  onChange={e => setAddRows(prev => prev.map((r, j) => j === i ? { ...r, expiryAt: e.target.value } : r))}
                  className="border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {addRows.length > 1 && (
                  <button onClick={() => setAddRows(prev => prev.filter((_, j) => j !== i))} className="text-subtle hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setAddRows(prev => [...prev, { ...EMPTY }])}
              className="text-sm text-accent hover:underline"
            >
              + Add another row
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleAdd} saving={saving} saveLabel="Add Files" />
        </Modal>
      )}

      {/* Modal: Edit One */}
      {modal === 'editOne' && (
        <Modal title="Edit File Expiry" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">File Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiryAt}
                onChange={e => setForm(f => ({ ...f, expiryAt: e.target.value }))}
                className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleEditOne} saving={saving} saveLabel="Save Changes" />
        </Modal>
      )}

      {/* Modal: Bulk Edit Expiry */}
      {modal === 'bulkExpiry' && (
        <Modal title={`Update Expiry for ${selected.size} File(s)`} onClose={() => setModal(null)}>
          <p className="text-sm text-subtle mb-3">Set a new expiry date for all selected files.</p>
          <input
            type="date"
            value={bulkDate}
            onChange={e => setBulkDate(e.target.value)}
            className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <ModalActions onCancel={() => setModal(null)} onSave={handleBulkExpiry} saving={saving} saveLabel="Update Expiry" />
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-subtle hover:text-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onCancel, onSave, saving, saveLabel = 'Save' }) {
  return (
    <div className="flex justify-end gap-2 mt-5">
      <button onClick={onCancel} className="px-4 py-2 text-sm border border-divider rounded-lg text-muted hover:bg-surface transition-colors">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        {saveLabel}
      </button>
    </div>
  )
}
