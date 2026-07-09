'use client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '@/components/admin/Modal'
import FormField from '@/components/admin/FormField'

export default function EditProfileModal({ open, profile, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', address1: '', address2: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !profile) return
    setError('')
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      mobile: profile.mobile || '',
      address1: profile.address1 || '',
      address2: profile.address2 || '',
    })
  }, [open, profile])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.email.trim() && !form.mobile.trim()) { setError('Provide at least an email or mobile number'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          mobile: form.mobile.trim() || null,
          address1: form.address1.trim() || null,
          address2: form.address2.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      onSaved(data)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      footer={(
        <>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-divider-light text-sm font-medium text-muted py-2.5 hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save'}
          </button>
        </>
      )}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <FormField label="Name" name="name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      <FormField label="Email" name="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
      <FormField label="Mobile" name="mobile" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
      <FormField label="Address 1" name="address1" value={form.address1} onChange={(e) => set('address1', e.target.value)} />
      <FormField label="Address 2" name="address2" value={form.address2} onChange={(e) => set('address2', e.target.value)} />
    </Modal>
  )
}
