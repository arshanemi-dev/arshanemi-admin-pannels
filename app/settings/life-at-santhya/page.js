'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function LifeAtSanthyaPage() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/life-at-arshanemi').then((r) => r.json()).then(setForm)
  }, [])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  async function save(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/life-at-arshanemi', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('Saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  function updateVal(i, patch) {
    setForm((f) => ({ ...f, companyValues: f.companyValues.map((v, idx) => idx === i ? { ...v, ...patch } : v) }))
  }
  function updateMilestone(i, patch) {
    setForm((f) => ({ ...f, milestones: (f.milestones || []).map((m, idx) => idx === i ? { ...m, ...patch } : m) }))
  }

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto flex flex-col gap-5">
      <PageHeader title="Life at Arshanemi" />

      <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">Company Values</h3>
          <button type="button" onClick={() => setForm((f) => ({ ...f, companyValues: [...f.companyValues, { icon: '', title: '', desc: '' }] }))}
            className="text-xs text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {(form.companyValues || []).map((v, i) => (
          <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-subtle">Value {i + 1}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, companyValues: f.companyValues.filter((_, idx) => idx !== i) }))}
                className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <IconPicker label="Icon" value={v.icon} onChange={(val) => updateVal(i, { icon: val })} />
            <FormField label="Title" value={v.title || ''} onChange={(e) => updateVal(i, { title: e.target.value })} />
            <FormField label="Description" type="textarea" rows={2} value={v.desc || ''} onChange={(e) => updateVal(i, { desc: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted">Milestones</h3>
          <button type="button" onClick={() => setForm((f) => ({ ...f, milestones: [...(f.milestones || []), { year: '', title: '', desc: '' }] }))}
            className="text-xs text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {(form.milestones || []).map((m, i) => (
          <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-subtle">Milestone {i + 1}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }))}
                className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Year" value={m.year || ''} onChange={(e) => updateMilestone(i, { year: e.target.value })} />
              <FormField label="Title" value={m.title || ''} onChange={(e) => updateMilestone(i, { title: e.target.value })} />
            </div>
            <FormField label="Description" type="textarea" rows={2} value={m.desc || ''} onChange={(e) => updateMilestone(i, { desc: e.target.value })} />
          </div>
        ))}
      </div>

      <button type="submit" disabled={loading}
        className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
