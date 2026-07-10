'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function ProcessPage() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/process').then((r) => r.json()).then(setForm)
  }, [])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  async function save(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/process', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('Process steps saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  function updateStep(i, patch) {
    setForm((f) => ({
      ...f,
      processSteps: f.processSteps.map((s, idx) => idx === i ? { ...s, ...patch } : s),
    }))
  }

  function updateTag(stepIdx, tagIdx, val) {
    setForm((f) => {
      const steps = [...f.processSteps]
      const tags = [...(steps[stepIdx].tags || [])]
      tags[tagIdx] = val
      steps[stepIdx] = { ...steps[stepIdx], tags }
      return { ...f, processSteps: steps }
    })
  }

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto flex flex-col gap-5">
      <PageHeader title="Process Steps" description="3-step process shown on homepage" />
      {(form.processSteps || []).map((step, i) => (
        <div key={i} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted">Step {step.number || i + 1}</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Number" value={step.number || ''} onChange={(e) => updateStep(i, { number: e.target.value })} />
            <IconPicker label="Icon" value={step.icon} onChange={(v) => updateStep(i, { icon: v })} />
          </div>
          <FormField label="Title" value={step.title || ''} onChange={(e) => updateStep(i, { title: e.target.value })} />
          <FormField label="Description" type="textarea" rows={3} value={step.description || ''} onChange={(e) => updateStep(i, { description: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Tags</label>
            <div className="flex flex-col gap-2">
              {(step.tags || []).map((tag, ti) => (
                <div key={ti} className="flex gap-2 items-center">
                  <input value={tag} onChange={(e) => updateTag(i, ti, e.target.value)}
                    className="flex-1 text-sm border border-divider rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent" />
                  <button type="button" onClick={() => updateStep(i, { tags: step.tags.filter((_, idx) => idx !== ti) })}
                    className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => updateStep(i, { tags: [...(step.tags || []), ''] })}
                className="text-xs text-accent font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add tag
              </button>
            </div>
          </div>
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
        {loading ? 'Saving…' : 'Save Process Steps'}
      </button>
    </form>
  )
}
