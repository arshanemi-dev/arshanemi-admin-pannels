'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function CompanyPage() {
  const [form, setForm] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  function loadData() {
    setFetchError(false)
    setForm(null)
    fetch('/api/admin/singleton/company')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setForm)
      .catch(() => setFetchError(true))
  }

  useEffect(loadData, [])

  if (fetchError) return <LoadError onRetry={loadData} />
  if (!form) return <FormSkeleton rows={6} />

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/singleton/company', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) addToast('Company info saved!')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error — please try again', 'error')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <PageHeader title="Company Info" description="Contact details used across the site" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <FormField label="Main Email (receives contact & lead notifications)" name="email" type="email" value={form.email || ''} onChange={handle} required />
        <FormField label="HR Email (careers page apply links)" name="hrEmail" type="email" value={form.hrEmail || ''} onChange={handle} placeholder="hr@santhyainfotech.com" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Primary Phone" name="phonePrimary" value={form.phonePrimary || ''} onChange={handle} />
          <FormField label="Secondary Phone" name="phoneSecondary" value={form.phoneSecondary || ''} onChange={handle} />
        </div>
        <FormField label="WhatsApp Number (digits only)" name="whatsapp" value={form.whatsapp || ''} onChange={handle} />
        <FormField label="Address" name="address" type="textarea" rows={2} value={form.address || ''} onChange={handle} />
        <FormField label="Business Hours" name="hours" value={form.hours || ''} onChange={handle} />
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
