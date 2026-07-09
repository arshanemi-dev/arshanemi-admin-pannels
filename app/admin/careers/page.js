'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { CardSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function CareersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  function load() {
    setError(false)
    setLoading(true)
    fetch('/api/admin/careers')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(load, [])

  const openings = data.filter((d) => d.type === 'opening')

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/careers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Position', type: 'opening', location: 'Surat, Gujarat', experience: '', skills: [] }),
      })
      if (!res.ok) { addToast('Failed to create position', 'error'); return }
      const item = await res.json()
      setData((d) => [item, ...d])
    } catch {
      addToast('Network error', 'error')
    }
  }

  async function handleSave(item) {
    setSaving(item.id)
    try {
      const res = await fetch(`/api/admin/careers/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
      })
      if (res.ok) addToast('Position saved')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error', 'error')
    }
    setSaving(null)
  }

  async function handleDelete(item) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/careers/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        setData((d) => d.filter((i) => i.id !== item.id))
        addToast('Position deleted')
      } else {
        addToast('Delete failed', 'error')
      }
    } catch {
      addToast('Network error', 'error')
    }
    setDeleting(false)
    setConfirm(null)
  }

  const update = (id, patch) => setData((d) => d.map((i) => i.id === id ? { ...i, ...patch } : i))

  return (
    <>
      <PageHeader title="Careers" description="Job openings" />
      <div className="flex justify-end mb-4">
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : error ? (
        <LoadError onRetry={load} />
      ) : (
        <div className="flex flex-col gap-4">
          {openings.length === 0 && (
            <div className="text-center py-16 text-subtle text-sm">
              No job openings yet — click <span className="font-semibold text-accent">+ Add Position</span> to create one.
            </div>
          )}
          {openings.map((job) => (
            <div key={job.id} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Job Title" value={job.title || ''} onChange={(e) => update(job.id, { title: e.target.value })} required />
                <FormField label="Type" type="select" value={job.jobType || 'Full-Time'}
                  onChange={(e) => update(job.id, { jobType: e.target.value })}
                  options={[{ value: 'Full-Time', label: 'Full-Time' }, { value: 'Part-Time', label: 'Part-Time' }, { value: 'Contract', label: 'Contract' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Location" value={job.location || ''} onChange={(e) => update(job.id, { location: e.target.value })} />
                <FormField label="Experience" value={job.experience || ''} onChange={(e) => update(job.id, { experience: e.target.value })} placeholder="e.g. 1–3 Years" />
              </div>
              <FormField label="Skills (comma-separated)" value={Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || '')}
                onChange={(e) => update(job.id, { skills: e.target.value.split(',').map((s) => s.trim()) })} />
              <FormField label="Job Description (shown in modal)" name="description" type="textarea" rows={4}
                value={job.description || ''} onChange={(e) => update(job.id, { description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements…" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => handleSave(job)} disabled={saving === job.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-60">
                  <Save className="w-4 h-4" /> {saving === job.id ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setConfirm(job)}
                  className="p-2 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!confirm} title="Delete this position?" description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={deleting} />
    </>
  )
}
