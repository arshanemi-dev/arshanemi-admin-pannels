'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/admin/Toast'
import ToolForm from '../ToolForm'

export default function EditToolPage() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [tool, setTool] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/tools/${id}`).then((r) => r.json()).then(setTool)
  }, [id])

  async function handleSubmit(payload) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { addToast('Save failed', 'error'); return }
      const saved = await res.json()
      setTool(saved)
      addToast('Saved!')
    } catch {
      addToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!tool) return <div className="text-subtle text-sm">Loading…</div>

  return (
    <ToolForm
      key={tool.id}
      initialForm={tool}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Save Changes"
      heading="Edit Tool"
    />
  )
}
