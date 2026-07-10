'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function ContactPage() {
  const [form, setForm] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  function loadData() {
    setFetchError(false)
    setForm(null)
    fetch('/api/admin/singleton/contact')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setForm)
      .catch(() => setFetchError(true))
  }

  useEffect(loadData, [])

  if (fetchError) return <LoadError onRetry={loadData} />
  if (!form) return <FormSkeleton rows={2} />

  async function save(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/singleton/contact', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) addToast('Contact page saved!')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error — please try again', 'error')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto">
      <PageHeader title="Contact Page" />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <div className="text-xs text-subtle bg-surface border border-divider rounded-lg px-4 py-3">
          Services in the contact form are pulled automatically from <strong>Admin → Services</strong>. No need to manage them here.
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">Budget Options</h3>
          <FormField
            label="Budget options (one per line)"
            type="textarea"
            rows={5}
            value={Array.isArray(form.contactBudgets) ? form.contactBudgets.join('\n') : ''}
            onChange={(e) => setForm((f) => ({ ...f, contactBudgets: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
          />
        </div>
        <button type="submit" disabled={loading}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Contact Page'}
        </button>
      </div>
    </form>
  )
}
