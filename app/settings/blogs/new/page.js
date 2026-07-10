'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import ImageUpload from '@/components/admin/ImageUpload'
import BlogBlockEditor from '@/components/admin/BlogBlockEditor'
import { useToast } from '@/components/admin/Toast'

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function NewBlogPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', author: '',
    status: 'draft', image: null, content: [],
    dateISO: new Date().toISOString().slice(0, 10),
    category: { slug: '', name: '', id: 0 },
  })

  useEffect(() => {
    fetch('/api/admin/blog-categories').then((r) => r.json()).then(setCategories)
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handleTitle(e) {
    const title = e.target.value
    setForm((f) => ({
      ...f,
      title,
      slug: slugEdited ? f.slug : generateSlug(title),
    }))
  }

  function handleCategory(e) {
    const slug = e.target.value
    const cat = categories.find((c) => c.slug === slug)
    if (cat) set('category', { slug: cat.slug, name: cat.name, id: cat.numericId || cat.id })
  }

  async function save(status) {
    setLoading(true)
    const payload = {
      ...form,
      status,
      date: new Date(form.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    const res = await fetch('/api/admin/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      addToast(status === 'published' ? 'Post published!' : 'Draft saved')
      router.push('/settings/blogs')
    } else {
      addToast(data.error || 'Failed to save', 'error')
    }
    setLoading(false)
  }

  const charCount = form.excerpt?.length || 0

  return (
    <div className="pb-20">
      <PageHeader title="New Blog Post" backHref="/settings/blogs" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left — Content */}
        <div className="col-span-8 flex flex-col gap-5">
          <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
            <FormField label="Title" value={form.title} onChange={handleTitle} required
              placeholder="Blog post title…" />
            <div className="flex flex-col gap-1.5">
              <FormField label="Slug" value={form.slug}
                onChange={(e) => { setSlugEdited(true); set('slug', e.target.value) }}
                hint="URL: /blog/your-slug" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">
                Excerpt <span className="text-subtle font-normal">({charCount}/160)</span>
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Short description shown in post cards and OG meta…"
                className="w-full rounded-lg border border-divider-light px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-divider shadow-sm p-6">
            <h3 className="text-sm font-semibold text-muted mb-4">Content Blocks</h3>
            <BlogBlockEditor value={form.content} onChange={(c) => set('content', c)} />
          </div>
        </div>

        {/* Right — Metadata */}
        <div className="col-span-4 flex flex-col gap-5">
          {/* Status */}
          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted">Publish</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => save('draft')} disabled={loading}
                className="flex-1 py-2 rounded-xl border border-divider-light text-sm font-medium text-muted hover:bg-surface disabled:opacity-60 transition-colors">
                Save Draft
              </button>
              <button type="button" onClick={() => save('published')} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {loading ? 'Saving…' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted">Details</h3>
            <FormField label="Author" value={form.author} onChange={(e) => set('author', e.target.value)} />
            <FormField label="Date" type="date" value={form.dateISO?.slice(0, 10)}
              onChange={(e) => set('dateISO', e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">Category</label>
              <select
                value={form.category?.slug || ''}
                onChange={handleCategory}
                className="w-full rounded-lg border border-divider-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-divider shadow-sm p-5">
            <h3 className="text-sm font-semibold text-muted mb-4">Featured Image</h3>
            <ImageUpload value={form.image} onChange={(url) => set('image', url)} collection="blogs" label={null} />
          </div>

          {/* SEO Preview */}
          {(form.title || form.excerpt) && (
            <div className="bg-card rounded-2xl border border-divider shadow-sm p-5">
              <h3 className="text-sm font-semibold text-muted mb-3">SEO Preview</h3>
              <div className="text-xs text-subtle mb-1">santhyainfotech.com › blog</div>
              <div className="text-sm text-blue-700 font-medium leading-tight line-clamp-1">
                {form.title?.slice(0, 60) || 'Post Title'}
              </div>
              <div className="text-xs text-subtle mt-1 line-clamp-2">
                {form.excerpt?.slice(0, 160) || 'Post excerpt will appear here.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
