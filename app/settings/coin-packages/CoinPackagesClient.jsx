'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import Modal from '@/components/admin/Modal'
import FormField from '@/components/admin/FormField'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

function emptyForm() {
  return { name: '', coins: '', priceRupees: '', badge: '', validityDays: 365, displayOrder: 0, isActive: true }
}

function toForm(pkg) {
  return {
    name: pkg.name || '',
    coins: pkg.coins ?? '',
    priceRupees: pkg.pricePaise != null ? pkg.pricePaise / 100 : '',
    badge: pkg.badge || '',
    validityDays: pkg.validityDays ?? 365,
    displayOrder: pkg.displayOrder ?? 0,
    isActive: !!pkg.isActive,
  }
}

function formatValidity(days) {
  if (!days) return '—'
  if (days % 365 === 0) return `${days / 365} yr${days === 365 ? '' : 's'} validity`
  if (days % 30 === 0) return `${days / 30} mo${days === 30 ? '' : 's'} validity`
  return `${days}d validity`
}

// CRUD grid for buy packs (name, coins, price, badge, active) — the coins a
// customer can purchase on /settings/plan via Razorpay. See
// plan/my-payment-management.md §6.1.
export default function CoinPackagesClient({ initialPackages }) {
  const { addToast } = useToast()
  const [packages, setPackages] = useState(initialPackages || [])
  const [formModal, setFormModal] = useState(null) // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setSelected(null)
    setForm(emptyForm())
    setError('')
    setFormModal('create')
  }

  function openEdit(pkg) {
    setSelected(pkg)
    setForm(toForm(pkg))
    setError('')
    setFormModal('edit')
  }

  function closeForm() {
    setFormModal(null)
    setSelected(null)
  }

  async function handleSave() {
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!Number.isFinite(+form.coins) || +form.coins <= 0) { setError('Coins must be a positive number'); return }
    if (!Number.isFinite(+form.priceRupees) || +form.priceRupees <= 0) { setError('Price must be a positive number'); return }
    if (!Number.isFinite(+form.validityDays) || +form.validityDays <= 0) { setError('Validity must be a positive number of days'); return }

    setSaving(true)
    try {
      const url = formModal === 'create' ? '/api/admin/coin-packages' : `/api/admin/coin-packages/${selected.id}`
      const method = formModal === 'create' ? 'POST' : 'PUT'
      const body = {
        name: form.name.trim(),
        coins: +form.coins,
        pricePaise: Math.round(+form.priceRupees * 100),
        badge: form.badge.trim() || null,
        validityDays: +form.validityDays,
        displayOrder: Number.isFinite(+form.displayOrder) ? +form.displayOrder : 0,
        isActive: form.isActive,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }

      setPackages((prev) =>
        formModal === 'create'
          ? [...prev, data].sort((a, b) => a.displayOrder - b.displayOrder)
          : prev.map((p) => (p.id === data.id ? data : p))
      )
      addToast(formModal === 'create' ? 'Package created' : 'Package updated')
      closeForm()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/coin-packages/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { addToast('Delete failed', 'error'); return }
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      addToast('Package deleted')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Coin Packages</h1>
            <p className="text-sm text-subtle">{packages.length} package{packages.length === 1 ? '' : 's'} — shown on Settings → Plan</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-card rounded-2xl border border-divider shadow-sm p-10 text-center text-sm text-subtle">
          No coin packages yet — create one to show it on the Plan page.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground truncate pr-2">{pkg.name}</h3>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => openEdit(pkg)} title="Edit" className="p-1.5 text-subtle hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(pkg)} title="Delete" className="p-1.5 text-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-2xl font-bold text-foreground">₹{(pkg.pricePaise / 100).toLocaleString('en-IN')}</p>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface text-muted">{pkg.coins.toLocaleString('en-IN')} coins</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface text-muted">{formatValidity(pkg.validityDays)}</span>
                {pkg.badge && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-accent/10 text-accent">{pkg.badge}</span>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${pkg.isActive ? 'bg-green-50 text-green-700' : 'bg-surface text-subtle'}`}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!formModal}
        onClose={closeForm}
        title={formModal === 'create' ? 'New Coin Package' : 'Edit Coin Package'}
        footer={(
          <>
            <button
              onClick={closeForm}
              className="flex-1 rounded-xl border border-divider-light text-sm font-medium text-muted py-2.5 hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <FormField label="Name" name="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Starter Pack" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Coins" name="coins" type="number" min={1} required value={form.coins} onChange={(e) => set('coins', e.target.value)} />
          <FormField label="Price (₹)" name="priceRupees" type="number" min={1} required value={form.priceRupees} onChange={(e) => set('priceRupees', e.target.value)} />
        </div>
        <FormField label="Badge" name="badge" value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. Best Value (optional)" />
        <FormField label="Validity (Days)" name="validityDays" type="number" min={1} required value={form.validityDays} onChange={(e) => set('validityDays', e.target.value)} hint="How long coins from this package stay valid after purchase" />
        <FormField label="Display Order" name="displayOrder" type="number" min={0} value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} hint="Lower numbers show first on the Plan page" />

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Active</label>
          <FormField name="isActive" type="toggle" value={form.isActive} onChange={(e) => set('isActive', e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coin package?"
        description={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
