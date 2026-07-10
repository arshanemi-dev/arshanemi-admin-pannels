'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

const BADGE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Most Popular', label: 'Most Popular' },
  { value: 'Best Value', label: 'Best Value' },
]

const COLOR_OPTIONS = [
  { value: 'from-slate-400 to-slate-500', label: 'Silver (Slate)' },
  { value: 'from-amber-400 to-orange-500', label: 'Gold (Amber → Orange)' },
  { value: 'from-violet-500 to-indigo-600', label: 'Platinum (Violet → Indigo)' },
  { value: 'from-indigo-500 to-purple-600', label: 'Indigo → Purple' },
  { value: 'from-green-500 to-emerald-600', label: 'Green → Emerald' },
  { value: 'from-blue-500 to-cyan-600', label: 'Blue → Cyan' },
]

export default function EditPackagePage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function loadData() {
    setFetchError(false)
    setForm(null)
    fetch(`/api/admin/seo-packages/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setForm)
      .catch(() => setFetchError(true))
  }

  useEffect(loadData, [id])

  if (fetchError) return <LoadError onRetry={loadData} />
  if (!form) return <FormSkeleton rows={6} />

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function addFeature() {
    setForm((f) => ({ ...f, features: [...(f.features || []), { label: '', value: true }] }))
  }

  function removeFeature(i) {
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
  }

  function updateFeature(i, patch) {
    setForm((f) => ({
      ...f,
      features: f.features.map((feat, idx) => (idx === i ? { ...feat, ...patch } : feat)),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      badge: form.badge || null,
    }
    try {
      const res = await fetch(`/api/admin/seo-packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        addToast('Package saved!')
        // Clear Next.js router cache so the list shows updated data when navigated back to
        router.refresh()
      } else {
        addToast('Save failed', 'error')
      }
    } catch {
      addToast('Network error — please try again', 'error')
    }
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/seo-packages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Package deleted')
        router.refresh()
        router.push('/settings/seo-packages')
      } else {
        addToast('Delete failed', 'error')
        setDeleting(false)
        setConfirmDelete(false)
      }
    } catch {
      addToast('Network error', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-5">
        <PageHeader title={`Edit: ${form.name} Package`} backHref="/settings/seo-packages" />
        <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Package Name" name="name" value={form.name || ''} onChange={handle} required />
            <FormField label="Tagline" name="tagline" value={form.tagline || ''} onChange={handle} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Price" name="price" type="number" value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value)} />
            <FormField label="Currency" name="currency" value={form.currency || '$'} onChange={handle} />
            <FormField label="Period" name="period" value={form.period || 'month'} onChange={handle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Badge"
              name="badge"
              type="select"
              value={form.badge || ''}
              onChange={handle}
              options={BADGE_OPTIONS}
              hint="Highlighted ribbon shown on the pricing card"
            />
            <FormField label="CTA Button Text" name="cta" value={form.cta || 'Get Started'} onChange={handle} />
          </div>

          <FormField
            label="Card Color"
            name="color"
            type="select"
            value={form.color || 'from-slate-400 to-slate-500'}
            onChange={handle}
            options={COLOR_OPTIONS}
          />

          <FormField
            label="Teaser Features (comma-separated)"
            name="teaserFeatures"
            value={Array.isArray(form.teaserFeatures) ? form.teaserFeatures.join(', ') : ''}
            onChange={(e) =>
              set('teaserFeatures', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
            }
          />

          {/* Features list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted">Features</h3>
              <button
                type="button"
                onClick={addFeature}
                className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
              >
                + Add Feature
              </button>
            </div>
            {(!form.features || form.features.length === 0) && (
              <p className="text-sm text-subtle text-center py-4 border border-dashed border-divider rounded-xl">
                No features yet — click Add Feature
              </p>
            )}
            <div className="flex flex-col gap-2">
              {(form.features || []).map((feat, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={feat.label || ''}
                    onChange={(e) => updateFeature(i, { label: e.target.value })}
                    placeholder="Feature label"
                    className="flex-1 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="checkbox"
                    checked={feat.value !== false}
                    title="Included in package"
                    onChange={(e) =>
                      updateFeature(i, {
                        value: e.target.checked
                          ? (typeof feat.value === 'string' ? feat.value : true)
                          : false,
                      })
                    }
                    className="w-4 h-4 rounded accent-accent shrink-0"
                  />
                  {feat.value !== false && (
                    <input
                      value={typeof feat.value === 'string' ? feat.value : ''}
                      onChange={(e) => updateFeature(i, { value: e.target.value || true })}
                      placeholder="Detail (optional)"
                      className="w-32 text-sm border border-divider rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="p-1 text-subtle hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-divider">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-600 border border-red-200 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Package
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save Package'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${form.name}" package?`}
        description="This will permanently remove this package and cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
