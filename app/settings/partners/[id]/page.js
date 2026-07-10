'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import { useToast } from '@/components/admin/Toast'

export default function EditPartnerPage() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/partners/${id}`).then((r) => r.json()).then(setForm)
  }, [id])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>
  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('Saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <PageHeader title="Edit Partner" backHref="/settings/partners" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <ImageUpload label="Logo" value={form.url} onChange={(url) => setForm((f) => ({ ...f, url }))} collection="partners" />
        <FormField label="Company Name" name="name" value={form.name} onChange={handle} required />
        <FormField label="Alt Text / Title" name="title" value={form.title} onChange={handle} />
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
