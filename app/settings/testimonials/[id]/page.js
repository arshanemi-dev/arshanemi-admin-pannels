'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import { useToast } from '@/components/admin/Toast'

export default function EditTestimonialPage() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/testimonials/${id}`).then((r) => r.json()).then(setForm)
  }, [id])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>
  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) addToast('Saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Edit Testimonial" backHref="/settings/testimonials" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <ImageUpload label="Avatar" value={form.avatar}
          onChange={(url) => setForm((f) => ({ ...f, avatar: url }))} collection="testimonials" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" name="name" value={form.name} onChange={handle} required />
          <FormField label="Role" name="role" value={form.role || ''} onChange={handle} />
        </div>
        <FormField label="Company" name="company" value={form.company || ''} onChange={handle} />
        <FormField label="Review Text" name="text" type="textarea" rows={4} value={form.text || ''} onChange={handle} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                <Star className={`w-6 h-6 ${n <= (form.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-subtle'}`} />
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
