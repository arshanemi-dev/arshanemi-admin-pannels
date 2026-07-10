'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function AboutPage() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/about').then((r) => r.json()).then(setForm)
  }, [])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  async function save(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/about', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('About page saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  function updateArr(key, i, patch) {
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, ...patch } : item) }))
  }

  const ArraySection = ({ title, arrKey, fields }) => (
    <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted">{title}</h3>
        <button type="button" onClick={() => setForm((f) => ({ ...f, [arrKey]: [...(f[arrKey] || []), {}] }))}
          className="text-xs text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>
      {(form[arrKey] || []).map((item, i) => (
        <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-subtle">#{i + 1}</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, [arrKey]: f[arrKey].filter((_, idx) => idx !== i) }))}
              className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          {fields.includes('icon') && <IconPicker label="Icon" value={item.icon} onChange={(v) => updateArr(arrKey, i, { icon: v })} />}
          {fields.includes('title') && <FormField label="Title" value={item.title || ''} onChange={(e) => updateArr(arrKey, i, { title: e.target.value })} />}
          {fields.includes('text') && <FormField label="Text" type="textarea" rows={2} value={item.text || ''} onChange={(e) => updateArr(arrKey, i, { text: e.target.value })} />}
          {fields.includes('desc') && <FormField label="Description" type="textarea" rows={2} value={item.desc || ''} onChange={(e) => updateArr(arrKey, i, { desc: e.target.value })} />}
          {fields.includes('value') && <FormField label="Value" value={item.value || ''} onChange={(e) => updateArr(arrKey, i, { value: e.target.value })} />}
          {fields.includes('label') && <FormField label="Label" value={item.label || ''} onChange={(e) => updateArr(arrKey, i, { label: e.target.value })} />}
        </div>
      ))}
    </div>
  )

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto flex flex-col gap-5">
      <PageHeader title="About Page" description="Mission, values, team services, why us" />
      <ArraySection title="About Values (Mission/Vision)" arrKey="aboutValues" fields={['icon', 'title', 'text']} />
      <ArraySection title="About Services" arrKey="aboutServices" fields={['icon', 'title', 'text']} />
      <ArraySection title="Why Us Points" arrKey="whyUs" fields={['icon', 'title', 'desc']} />
      <ArraySection title="About Stats" arrKey="aboutStats" fields={['value', 'label']} />
      <button type="submit" disabled={loading}
        className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
        {loading ? 'Saving…' : 'Save About Page'}
      </button>
    </form>
  )
}
