'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function BadgesPage() {
  const [badges, setBadges] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/badges').then((r) => r.json()).then(setBadges)
  }, [])

  if (!badges) return <div className="text-subtle text-sm">Loading…</div>

  function update(i, patch) {
    setBadges((b) => b.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/badges', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(badges),
    })
    if (res.ok) addToast('Trust badges saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Trust Badges" description="6 trust signals displayed on homepage" />
      <div className="flex flex-col gap-4">
        {badges.map((badge, i) => (
          <div key={i} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted">Badge {i + 1}</h3>
            <IconPicker label="Icon" value={badge.icon} onChange={(v) => update(i, { icon: v })} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Label" value={badge.label || ''} onChange={(e) => update(i, { label: e.target.value })} />
              <FormField label="Sub-label" value={badge.sub || ''} onChange={(e) => update(i, { sub: e.target.value })} />
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Badges'}
        </button>
      </div>
    </form>
  )
}
