'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'

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

export default function NewPackagePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    price: '',
    currency: '$',
    period: 'month',
    badge: '',
    color: 'from-slate-400 to-slate-500',
    cta: 'Get Started',
    teaserFeatures: [],
    features: [],
  })

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function addFeature() {
    setForm((f) => ({ ...f, features: [...f.features, { label: '', value: true }] }))
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
    if (!form.name.trim()) return addToast('Package name is required', 'error')
    setLoading(true)
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      badge: form.badge || null,
    }
    const res = await fetch('/api/admin/seo-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      addToast('Package created!')
      router.push('/settings/seo-packages')
    } else {
      addToast('Create failed', 'error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-5">
      <PageHeader title="New SEO Package" backHref="/settings/seo-packages" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Package Name" name="name" value={form.name} onChange={handle} required />
          <FormField label="Tagline" name="tagline" value={form.tagline} onChange={handle} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Price" name="price" type="number" value={form.price}
            onChange={(e) => set('price', e.target.value)} />
          <FormField label="Currency" name="currency" value={form.currency} onChange={handle} />
          <FormField label="Period" name="period" value={form.period} onChange={handle} hint="e.g. month, year" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Badge"
            name="badge"
            type="select"
            value={form.badge}
            onChange={handle}
            options={BADGE_OPTIONS}
            hint="Highlighted ribbon shown on the pricing card"
          />
          <FormField label="CTA Button Text" name="cta" value={form.cta} onChange={handle} />
        </div>

        <FormField
          label="Card Color"
          name="color"
          type="select"
          value={form.color}
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
          hint="Short highlights shown on the card preview"
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
          {form.features.length === 0 && (
            <p className="text-sm text-subtle text-center py-4 border border-dashed border-divider rounded-xl">
              No features yet — click Add Feature
            </p>
          )}
          <div className="flex flex-col gap-2">
            {form.features.map((feat, i) => (
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

        <button
          type="submit"
          disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create Package'}
        </button>
      </div>
    </form>
  )
}
