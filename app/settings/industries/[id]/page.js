'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

export default function EditIndustryPage() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/industries/${id}`).then((r) => r.json()).then(setForm)
  }, [id])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      benefits: typeof form.benefits === 'string' ? form.benefits.split(',').map((b) => b.trim()) : form.benefits,
      services: typeof form.services === 'string' ? form.services.split(',').map((s) => s.trim()) : form.services,
    }
    const res = await fetch(`/api/admin/industries/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (res.ok) addToast('Saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Edit Industry" backHref="/settings/industries" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" name="name" value={form.name || ''} onChange={handle} required />
          <FormField label="Slug" name="slug" value={form.slug || ''} onChange={handle} required />
        </div>
        <IconPicker label="Icon" value={form.icon} onChange={(v) => set('icon', v)} />
        <FormField label="Description" name="description" type="textarea" rows={3} value={form.description || ''} onChange={handle} />
        <FormField label="Benefits (comma-separated)" name="benefits"
          value={Array.isArray(form.benefits) ? form.benefits.join(', ') : (form.benefits || '')} onChange={handle} />
        <FormField label="Service slugs (comma-separated)" name="services"
          value={Array.isArray(form.services) ? form.services.join(', ') : (form.services || '')} onChange={handle} />
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
