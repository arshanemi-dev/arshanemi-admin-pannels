'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'

export default function HeroPage() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/hero').then((r) => r.json()).then(setForm)
  }, [])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/hero', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('Hero content saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  function updateBullet(i, val) {
    setForm((f) => ({ ...f, bullets: f.bullets.map((b, idx) => idx === i ? val : b) }))
  }
  function updateMetric(i, patch) {
    setForm((f) => ({ ...f, metrics: f.metrics.map((m, idx) => idx === i ? { ...m, ...patch } : m) }))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Hero Content" description="Bullets and metric bars on the homepage" />
      <div className="flex flex-col gap-5">
        {/* Bullets */}
        <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted">Hero Bullets</h3>
          {(form.bullets || []).map((b, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={b} onChange={(e) => updateBullet(i, e.target.value)}
                className="flex-1 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={`Bullet ${i + 1}`} />
              <button type="button" onClick={() => setForm((f) => ({ ...f, bullets: f.bullets.filter((_, idx) => idx !== i) }))}
                className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setForm((f) => ({ ...f, bullets: [...(f.bullets || []), ''] }))}
            className="text-xs text-accent font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add bullet
          </button>
        </div>

        {/* Metrics */}
        <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted">Metric Bars</h3>
          {(form.metrics || []).map((m, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 p-3 border border-divider rounded-xl">
              <FormField label="Label" value={m.label || ''} onChange={(e) => updateMetric(i, { label: e.target.value })} />
              <FormField label="Value" value={m.value || ''} onChange={(e) => updateMetric(i, { value: e.target.value })} placeholder="+180%" />
              <FormField label="Width %" value={m.width || ''} onChange={(e) => updateMetric(i, { width: e.target.value })} placeholder="80%" />
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Hero Content'}
        </button>
      </div>
    </form>
  )
}
