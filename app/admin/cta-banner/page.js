'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

const DEFAULTS = {
  eyebrow: 'Free SEO Consultation',
  headline: 'Ready to Grow Your Business',
  highlightWord: 'Online?',
  description: "Get a free, no-obligation SEO audit worth ₹5,000. Our experts will analyze your website and show you exactly where you're losing rankings and traffic.",
  primaryCTA: 'Get Free SEO Audit',
  primaryHref: '/contact',
  secondaryCTA: 'WhatsApp Us',
  imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&fit=crop',
  trustPoints: [
    { icon: 'Zap', text: 'Results in 30 Days' },
    { icon: 'Users', text: '100+ Happy Clients' },
    { icon: 'TrendingUp', text: 'Proven ROI Growth' },
    { icon: 'Award', text: '5+ Years Experience' },
  ],
  metrics: [
    { value: '300K+', label: 'Organic Impressions', color: 'text-accent-light' },
    { value: '98%', label: 'Client Retention', color: 'text-cyan' },
    { value: '50K+', label: 'Monthly Sessions', color: 'text-accent-light' },
    { value: '5+', label: 'Years Experience', color: 'text-cyan' },
  ],
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted border-b border-divider pb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function CTABannerAdminPage() {
  const [form, setForm] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  function loadData() {
    setFetchError(false)
    setForm(null)
    fetch('/api/admin/singleton/cta-banner')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => setForm(Object.keys(d).length ? { ...DEFAULTS, ...d } : { ...DEFAULTS }))
      .catch(() => setFetchError(true))
  }

  useEffect(loadData, [])

  if (fetchError) return <LoadError onRetry={loadData} />
  if (!form) return <FormSkeleton rows={7} />

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const handle = (e) => set(e.target.name, e.target.value)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/singleton/cta-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) addToast('CTA Banner saved!')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error — please try again', 'error')
    }
    setLoading(false)
  }

  const trustPoints = form.trustPoints || []
  const metrics = form.metrics || []

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-24 flex flex-col gap-5">
      <PageHeader
        title="CTA Banner"
        description="Controls the call-to-action section shown at the bottom of every page."
      />

      {/* Image */}
      <SectionCard title="Left-Side Image">
        <FormField
          label="Image URL (Unsplash or your upload URL)"
          name="imageUrl"
          value={form.imageUrl || ''}
          onChange={handle}
          placeholder="https://images.unsplash.com/photo-..."
        />
        {form.imageUrl && (
          <div className="relative h-40 rounded-xl overflow-hidden border border-divider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </SectionCard>

      {/* Main Copy */}
      <SectionCard title="Main Copy">
        <FormField label="Eyebrow Tag (e.g. 'Free SEO Consultation')" name="eyebrow" value={form.eyebrow || ''} onChange={handle} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Headline (main text)" name="headline" value={form.headline || ''} onChange={handle} />
          <FormField label="Highlight Word (gradient color)" name="highlightWord" value={form.highlightWord || ''} onChange={handle} placeholder="Online?" />
        </div>
        <FormField label="Description Paragraph" name="description" type="textarea" rows={3} value={form.description || ''} onChange={handle} />
      </SectionCard>

      {/* Buttons */}
      <SectionCard title="CTA Buttons">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Primary Button Text" name="primaryCTA" value={form.primaryCTA || ''} onChange={handle} />
          <FormField label="Primary Button Link" name="primaryHref" value={form.primaryHref || ''} onChange={handle} placeholder="/contact" />
        </div>
        <FormField label="Secondary Button Text (WhatsApp)" name="secondaryCTA" value={form.secondaryCTA || ''} onChange={handle} />
      </SectionCard>

      {/* Trust Points */}
      <SectionCard title="Trust Points (left panel checkmarks)">
        {trustPoints.map((pt, i) => (
          <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-subtle">Point #{i + 1}</span>
              <button
                type="button"
                onClick={() => set('trustPoints', trustPoints.filter((_, idx) => idx !== i))}
                className="p-1 text-subtle hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <IconPicker
                label="Icon"
                value={pt.icon}
                onChange={(v) => {
                  const next = [...trustPoints]; next[i] = { ...next[i], icon: v }; set('trustPoints', next)
                }}
              />
              <FormField
                label="Label Text"
                value={pt.text || ''}
                onChange={(e) => {
                  const next = [...trustPoints]; next[i] = { ...next[i], text: e.target.value }; set('trustPoints', next)
                }}
              />
            </div>
          </div>
        ))}
        {trustPoints.length < 6 && (
          <button
            type="button"
            onClick={() => set('trustPoints', [...trustPoints, { icon: 'CheckCircle', text: '' }])}
            className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover self-start"
          >
            <Plus className="w-3.5 h-3.5" /> Add Trust Point
          </button>
        )}
      </SectionCard>

      {/* Metrics */}
      <SectionCard title="Stats Grid (4 metrics shown on left panel)">
        {metrics.map((m, i) => (
          <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-subtle">Metric #{i + 1}</span>
              <button
                type="button"
                onClick={() => set('metrics', metrics.filter((_, idx) => idx !== i))}
                className="p-1 text-subtle hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Value (e.g. 300K+)"
                value={m.value || ''}
                onChange={(e) => { const next = [...metrics]; next[i] = { ...next[i], value: e.target.value }; set('metrics', next) }}
              />
              <FormField
                label="Label"
                value={m.label || ''}
                onChange={(e) => { const next = [...metrics]; next[i] = { ...next[i], label: e.target.value }; set('metrics', next) }}
              />
            </div>
            <FormField
              label="Color class (e.g. text-accent-light or text-cyan)"
              value={m.color || ''}
              onChange={(e) => { const next = [...metrics]; next[i] = { ...next[i], color: e.target.value }; set('metrics', next) }}
              placeholder="text-accent-light"
            />
          </div>
        ))}
        {metrics.length < 6 && (
          <button
            type="button"
            onClick={() => set('metrics', [...metrics, { value: '', label: '', color: 'text-accent-light' }])}
            className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover self-start"
          >
            <Plus className="w-3.5 h-3.5" /> Add Metric
          </button>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save CTA Banner'}
        </button>
      </div>
    </form>
  )
}
