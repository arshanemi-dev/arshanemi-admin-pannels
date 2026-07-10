'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

export default function FAQsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/faqs').then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [])

  async function handleDelete(item) {
    setDeleting(true)
    await fetch(`/api/admin/faqs/${item.id}`, { method: 'DELETE' })
    setData((d) => d.filter((i) => i.id !== item.id))
    addToast('FAQ deleted')
    setDeleting(false); setConfirm(null)
  }

  async function handleCreate() {
    const res = await fetch('/api/admin/faqs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'New FAQ', answer: '' }),
    })
    const item = await res.json()
    setData((d) => [item, ...d])
  }

  async function handleUpdate(item) {
    setSaving(item.id)
    await fetch(`/api/admin/faqs/${item.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
    })
    addToast('FAQ saved')
    setSaving(null)
  }

  const update = (id, patch) => setData((d) => d.map((i) => i.id === id ? { ...i, ...patch } : i))

  return (
    <>
      <PageHeader title="FAQs" description="Manage frequently asked questions">
      </PageHeader>
      <div className="flex justify-end mb-4">
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {loading ? <div className="text-subtle text-sm">Loading…</div> :
          data.map((faq) => (
            <div key={faq.id} className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <input value={faq.question} onChange={(e) => update(faq.id, { question: e.target.value })}
                    className="w-full text-sm font-medium border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Question" />
                  <textarea value={faq.answer} onChange={(e) => update(faq.id, { answer: e.target.value })}
                    rows={3} className="w-full text-sm border border-divider rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Answer" />
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleUpdate(faq)} disabled={saving === faq.id}
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/10 transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirm(faq)}
                    className="p-2 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <ConfirmDialog open={!!confirm} title="Delete this FAQ?" description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={deleting} />
    </>
  )
}
