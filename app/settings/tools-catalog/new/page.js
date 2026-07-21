'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/admin/Toast'
import ToolForm from '../ToolForm'

const EMPTY_FORM = {
  slug: '', title: '', icon: 'Search', shortDesc: '', category: 'research', badge: '',
  toolUrl: '', requiresLogin: false, features: [],
}

export default function NewToolPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(payload) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { addToast('Save failed', 'error'); return }
      addToast('Tool created!')
      router.push('/settings/tools-catalog')
    } catch {
      addToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolForm
      initialForm={EMPTY_FORM}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Create Tool"
      heading="New Tool"
    />
  )
}
