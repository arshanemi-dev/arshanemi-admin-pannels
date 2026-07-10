'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/stats').then((r) => r.json()).then(setStats)
  }, [])

  if (!stats) return <div className="text-subtle text-sm">Loading…</div>

  function update(i, patch) {
    setStats((s) => s.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/stats', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stats),
    })
    if (res.ok) addToast('Stats saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Stats" description="Homepage number stats" />
      <div className="flex flex-col gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted">Stat {i + 1}</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Value" type="number" value={stat.value} onChange={(e) => update(i, { value: Number(e.target.value) })} />
              <FormField label="Suffix" value={stat.suffix || ''} onChange={(e) => update(i, { suffix: e.target.value })} placeholder="e.g. + or %" />
              <IconPicker label="Icon" value={stat.icon} onChange={(v) => update(i, { icon: v })} />
            </div>
            <FormField label="Label" value={stat.label || ''} onChange={(e) => update(i, { label: e.target.value })} />
            <FormField label="Description" value={stat.description || ''} onChange={(e) => update(i, { description: e.target.value })} />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Stats'}
        </button>
      </div>
    </form>
  )
}
