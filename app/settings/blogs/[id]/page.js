'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import BlogBlockEditor from '@/components/admin/BlogBlockEditor'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

export default function EditBlogPage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/blogs/${id}`).then((r) => r.json()).then(setForm)
    fetch('/api/admin/blog-categories').then((r) => r.json()).then(setCategories)
  }, [id])

  if (!form) return <div className="text-subtle text-sm">Loading…</div>

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handleCategory(e) {
    const slug = e.target.value
    const cat = categories.find((c) => c.slug === slug)
    if (cat) set('category', { slug: cat.slug, name: cat.name, id: cat.numericId || cat.id })
  }

  async function save(status) {
    setLoading(true)
    const payload = { ...form, status }
    const res = await fetch(`/api/admin/blogs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) addToast(status === 'published' ? 'Post published!' : 'Draft saved')
    else addToast(data.error || 'Save failed', 'error')
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
    addToast('Post deleted')
    router.push('/settings/blogs')
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Edit Blog Post" backHref="/settings/blogs" />
        <button type="button" onClick={() => setConfirm(true)}
          className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors">
          Delete Post
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 flex flex-col gap-5">
          <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
            <FormField label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
            <FormField label="Slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} hint="/blog/your-slug" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">
                Excerpt <span className="text-subtle font-normal">({(form.excerpt || '').length}/160)</span>
              </label>
              <textarea value={form.excerpt || ''} onChange={(e) => set('excerpt', e.target.value)}
                maxLength={160} rows={3}
                className="w-full rounded-lg border border-divider-light px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-divider shadow-sm p-6">
            <h3 className="text-sm font-semibold text-muted mb-4">Content Blocks</h3>
            <BlogBlockEditor value={form.content || []} onChange={(c) => set('content', c)} />
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-5">
          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted">Publish</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => save('draft')} disabled={loading}
                className="flex-1 py-2 rounded-xl border border-divider-light text-sm font-medium text-muted hover:bg-surface disabled:opacity-60 transition-colors">
                Save Draft
              </button>
              <button type="button" onClick={() => save('published')} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {loading ? '…' : form.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </div>
            {form.slug && (
              <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent hover:underline text-center">
                Preview ↗
              </a>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted">Details</h3>
            <FormField label="Author" value={form.author || ''} onChange={(e) => set('author', e.target.value)} />
            <FormField label="Date" type="date" value={form.dateISO?.slice(0, 10) || ''}
              onChange={(e) => set('dateISO', e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">Category</label>
              <select value={form.category?.slug || ''} onChange={handleCategory}
                className="w-full rounded-lg border border-divider-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5">
            <h3 className="text-sm font-semibold text-muted mb-4">Featured Image</h3>
            <ImageUpload value={form.image} onChange={(url) => set('image', url)} collection="blogs" label={null} />
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirm} title={`Delete "${form.title}"?`}
        description="The post and its images will be permanently deleted."
        onConfirm={handleDelete} onCancel={() => setConfirm(false)} loading={deleting} />
    </div>
  )
}
