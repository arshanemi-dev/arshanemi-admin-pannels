'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import { useToast } from '@/components/admin/Toast'

const empty = { name: '', role: '', bio: '', email: '', linkedin: '', photo: null }

export default function NewTeamPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { addToast('Team member added!'); router.push('/settings/team') }
    else { addToast('Failed to create', 'error') }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Add Team Member" backHref="/settings/team" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <ImageUpload label="Photo" value={form.photo} onChange={(url) => setForm((f) => ({ ...f, photo: url }))} collection="team" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" name="name" value={form.name} onChange={handle} required />
          <FormField label="Role / Title" name="role" value={form.role} onChange={handle} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handle} />
          <FormField label="LinkedIn URL" name="linkedin" value={form.linkedin} onChange={handle} />
        </div>
        <FormField label="Bio" name="bio" type="textarea" rows={3} value={form.bio} onChange={handle} />
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Adding…' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}
