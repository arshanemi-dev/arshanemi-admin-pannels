'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  )
}

function isValidUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function EditToolHubPage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [urlError, setUrlError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  function load() {
    setLoadError(false)
    setForm(null)
    fetch(`/api/admin/tool-hub/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setForm)
      .catch(() => setLoadError(true))
  }

  useEffect(load, [id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const handle = (e) => {
    const { name, value } = e.target
    set(name, name === 'order' ? Number(value) : value)
  }

  function handleUrlBlur() {
    if (form.url && !isValidUrl(form.url)) {
      setUrlError('Enter a valid http:// or https:// URL')
    } else {
      setUrlError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidUrl(form.url)) {
      setUrlError('Enter a valid http:// or https:// URL')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tool-hub/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Tool updated!')
        router.push('/admin/tool-hub')
      } else {
        addToast(data.error || 'Failed to update', 'error')
      }
    } catch {
      addToast('Network error — please try again', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loadError) return <LoadError onRetry={load} />
  if (!form) return <FormSkeleton rows={6} />

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-24 flex flex-col gap-5">
      <PageHeader title="Edit Tool" backHref="/admin/tool-hub" />

      <SectionCard title="Tool Details">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" name="name" value={form.name} onChange={handle} required />
          <IconPicker label="Icon" value={form.icon} onChange={(v) => set('icon', v)} />
        </div>

        <FormField
          label="External URL"
          name="url"
          type="url"
          value={form.url}
          onChange={handle}
          onBlur={handleUrlBlur}
          error={urlError}
          required
          hint="Must be a valid https:// URL. The target site must allow iframe embedding (no X-Frame-Options: DENY / restrictive frame-ancestors CSP) — test after publishing."
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          rows={2}
          value={form.description}
          onChange={handle}
        />

        <FormField
          label="Sort Order"
          name="order"
          type="number"
          value={form.order}
          onChange={handle}
          hint="Lower numbers appear first on the public page"
        />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm font-medium text-gray-700">Enabled</span>
            <FormField type="toggle" name="enabled" value={form.enabled} onChange={handle} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm font-medium text-gray-700">Require Login</span>
            <FormField type="toggle" name="requiresLogin" value={form.requiresLogin} onChange={handle} />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          When Require Login is on, visitors must sign in via email or Google before this tool&apos;s iframe loads.
        </p>
      </SectionCard>

      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
