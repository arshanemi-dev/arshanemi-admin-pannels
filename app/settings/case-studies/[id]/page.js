'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import { useToast } from '@/components/admin/Toast'

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function EditCaseStudyPage() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/case-studies/${id}`).then((r) => r.json()).then(setForm)
  }, [id])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleSlug = (e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()) : form.tags }
    const res = await fetch(`/api/admin/case-studies/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (res.ok) addToast('Saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  const slug = form.slug || toSlug(form.title || '')

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <PageHeader title="Edit Case Study" backHref="/settings/case-studies" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <ImageUpload label="Image" value={form.image} onChange={(url) => set('image', url)} collection="case-studies" />
        <FormField label="Title" name="title" value={form.title || ''} onChange={handle} required />
        <div>
          <FormField label="URL Slug" name="slug" value={slug} onChange={handleSlug}
            hint={`Public URL: /case-studies/${slug}`} />
          {slug && (
            <a href={`/case-studies/${slug}`} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
              <ExternalLink className="w-3 h-3" /> Preview live page
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client Name" name="client" value={form.client || ''} onChange={handle} />
          <FormField label="Client Role" name="clientRole" value={form.clientRole || ''} onChange={handle} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Industry" name="industry" value={form.industry || ''} onChange={handle} />
          <FormField label="Service" name="service" value={form.service || ''} onChange={handle} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Duration" name="duration" value={form.duration || ''} onChange={handle} />
          <FormField label="Website" name="website" value={form.website || ''} onChange={handle} placeholder="example.com" />
        </div>
        <FormField label="Short Description" name="description" type="textarea" rows={3} value={form.description || ''} onChange={handle} />
        <FormField label="The Challenge" name="challenge" type="textarea" rows={4} value={form.challenge || ''} onChange={handle}
          placeholder="What problem was the client facing before working with you?" />
        <FormField label="Our Approach / Solution" name="solution" type="textarea" rows={4} value={form.solution || ''} onChange={handle}
          placeholder="What strategy and tactics did you use to solve the problem?" />
        <FormField label="Tags (comma-separated)" name="tags" value={Array.isArray(form.tags) ? form.tags.join(', ') : (form.tags || '')} onChange={handle} />
        <FormField label="Client Testimonial Quote" name="testimonial" type="textarea" rows={2} value={form.testimonial || ''} onChange={handle} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted">Metrics</label>
            <button type="button" onClick={() => set('metrics', [...(form.metrics || []), { label: '', value: '' }])}
              className="text-xs text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {(form.metrics || []).map((m, i) => (
            <div key={i} className="flex gap-3 items-center mb-2">
              <input value={m.value} onChange={(e) => { const ms = [...form.metrics]; ms[i] = { ...ms[i], value: e.target.value }; set('metrics', ms) }}
                placeholder="Value" className="w-32 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              <input value={m.label} onChange={(e) => { const ms = [...form.metrics]; ms[i] = { ...ms[i], label: e.target.value }; set('metrics', ms) }}
                placeholder="Label" className="flex-1 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              <button type="button" onClick={() => set('metrics', form.metrics.filter((_, idx) => idx !== i))}
                className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
