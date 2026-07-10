'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import { useToast } from '@/components/admin/Toast'

const empty = {
  title: '', slug: '', client: '', clientRole: '', industry: '', service: '',
  duration: '', website: '', image: null, description: '', challenge: '',
  solution: '', tags: [], testimonial: '',
  metrics: [{ label: '', value: '' }],
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function NewCaseStudyPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const handle = (e) => {
    const { name, value } = e.target
    setForm((f) => {
      const updated = { ...f, [name]: value }
      if (name === 'title' && !f._slugEdited) updated.slug = toSlug(value)
      return updated
    })
  }

  const handleSlug = (e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value), _slugEdited: true }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { _slugEdited, ...rest } = form
    const payload = { ...rest, tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()) : form.tags }
    const res = await fetch('/api/admin/case-studies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (res.ok) { addToast('Case study created!'); router.push('/settings/case-studies') }
    else addToast('Failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <PageHeader title="New Case Study" backHref="/settings/case-studies" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <ImageUpload label="Case Study Image" value={form.image} onChange={(url) => set('image', url)} collection="case-studies" />
        <FormField label="Title" name="title" value={form.title} onChange={handle} required />
        <FormField label="URL Slug" name="slug" value={form.slug} onChange={handleSlug}
          placeholder="auto-generated-from-title" hint="Used in the URL: /case-studies/your-slug" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client Name" name="client" value={form.client} onChange={handle} />
          <FormField label="Client Role" name="clientRole" value={form.clientRole} onChange={handle} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Industry" name="industry" value={form.industry} onChange={handle} />
          <FormField label="Service" name="service" value={form.service} onChange={handle} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Duration" name="duration" value={form.duration} onChange={handle} />
          <FormField label="Website" name="website" value={form.website} onChange={handle} placeholder="example.com" />
        </div>
        <FormField label="Short Description" name="description" type="textarea" rows={3} value={form.description} onChange={handle} />
        <FormField label="The Challenge" name="challenge" type="textarea" rows={4} value={form.challenge} onChange={handle}
          placeholder="What problem was the client facing before working with you?" />
        <FormField label="Our Approach / Solution" name="solution" type="textarea" rows={4} value={form.solution} onChange={handle}
          placeholder="What strategy and tactics did you use to solve the problem?" />
        <FormField label="Tags (comma-separated)" name="tags" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={handle} />
        <FormField label="Client Testimonial Quote" name="testimonial" type="textarea" rows={2} value={form.testimonial} onChange={handle} />

        {/* Metrics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted">Metrics</label>
            <button type="button" onClick={() => set('metrics', [...form.metrics, { label: '', value: '' }])}
              className="text-xs text-accent font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {form.metrics.map((m, i) => (
            <div key={i} className="flex gap-3 items-center mb-2">
              <input value={m.value} onChange={(e) => { const ms = [...form.metrics]; ms[i] = { ...ms[i], value: e.target.value }; set('metrics', ms) }}
                placeholder="Value (e.g. 300K+)" className="w-32 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              <input value={m.label} onChange={(e) => { const ms = [...form.metrics]; ms[i] = { ...ms[i], label: e.target.value }; set('metrics', ms) }}
                placeholder="Label (e.g. Organic Impressions)" className="flex-1 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              <button type="button" onClick={() => set('metrics', form.metrics.filter((_, idx) => idx !== i))}
                className="p-1 text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Creating…' : 'Create Case Study'}
        </button>
      </div>
    </form>
  )
}
