'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'
import { FormSkeleton, LoadError } from '@/components/admin/Skeleton'

const CATEGORY_OPTIONS = [
  { value: 'seo', label: 'SEO Services' },
  { value: 'advanced', label: 'Advanced SEO Services' },
  { value: 'other', label: 'Other Services' },
]

function SectionCard({ title, children }) {
  return (
    <div className="bg-card rounded-2xl border border-divider shadow-sm p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted border-b border-divider pb-3">{title}</h3>
      {children}
    </div>
  )
}

function ArraySection({ title, items, onChange, renderItem, onAdd, addLabel = 'Add Item' }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{title}</span>
        <button type="button" onClick={onAdd}
          className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border border-divider rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-subtle">#{i + 1}</span>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-1 text-subtle hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderItem(item, i, (patch) => {
            const next = [...items]
            next[i] = { ...next[i], ...patch }
            onChange(next)
          })}
        </div>
      ))}
    </div>
  )
}

export default function EditServicePage() {
  const { id } = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [form, setForm] = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [loading, setLoading] = useState(false)

  function loadData() {
    setFetchError(false)
    setForm(null)
    fetch(`/api/admin/services/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setForm)
      .catch(() => setFetchError(true))
  }

  useEffect(loadData, [id])

  if (fetchError) return <LoadError onRetry={loadData} />
  if (!form) return <FormSkeleton rows={8} />

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const handle = (e) => set(e.target.name, e.target.value)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        addToast('Service saved!')
        router.refresh()
      } else {
        addToast('Save failed', 'error')
      }
    } catch {
      addToast('Network error — please try again', 'error')
    }
    setLoading(false)
  }

  const features = form.features || []
  const stats = form.stats || []
  const process = form.process || []
  const whyUs = form.whyUs || []
  const faqs = form.faqs || []
  const relatedBlogs = form.relatedBlogs || []

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-24 flex flex-col gap-5">
      <PageHeader title="Edit Service" backHref="/settings/services" />

      {/* Basic Info */}
      <SectionCard title="Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title" name="title" value={form.title || ''} onChange={handle} required />
          <FormField label="Slug" name="slug" value={form.slug || ''} onChange={handle} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <IconPicker label="Icon" value={form.icon} onChange={(v) => set('icon', v)} />
          <FormField label="Category" name="category" type="select" value={form.category} onChange={handle}
            options={CATEGORY_OPTIONS} />
        </div>
        <FormField label="Short Description" name="shortDesc" type="textarea" rows={2}
          value={form.shortDesc || ''} onChange={handle} />
      </SectionCard>

      {/* Hero */}
      <SectionCard title="Hero Section">
        <FormField label="Headline" value={form.hero?.headline || ''}
          onChange={(e) => set('hero', { ...form.hero, headline: e.target.value })} />
        <FormField label="Subtext" type="textarea" rows={3} value={form.hero?.subtext || ''}
          onChange={(e) => set('hero', { ...form.hero, subtext: e.target.value })} />
      </SectionCard>

      {/* Stats */}
      <SectionCard title="Stats Strip">
        <p className="text-xs text-subtle -mt-1">Shown as a 4-column metrics strip below the hero. Add up to 8 stats; remove any you don't need.</p>
        <ArraySection
          title="Stat Items"
          items={stats}
          onChange={(v) => set('stats', v)}
          addLabel="Add Stat"
          onAdd={() => set('stats', [...stats, { value: '', label: '' }])}
          renderItem={(s, _i, update) => (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Value (e.g. 300K+)" value={s.value || ''}
                onChange={(e) => update({ value: e.target.value })} />
              <FormField label="Label (e.g. Monthly Sessions)" value={s.label || ''}
                onChange={(e) => update({ label: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      {/* Features */}
      <SectionCard title="Features">
        <ArraySection
          title="Feature Cards"
          items={features}
          onChange={(v) => set('features', v)}
          addLabel="Add Feature"
          onAdd={() => set('features', [...features, { icon: '', title: '', desc: '' }])}
          renderItem={(f, _i, update) => (
            <>
              <div className="grid grid-cols-2 gap-3">
                <IconPicker label="Icon" value={f.icon} onChange={(v) => update({ icon: v })} />
                <FormField label="Title" value={f.title || ''} onChange={(e) => update({ title: e.target.value })} />
              </div>
              <FormField label="Description" type="textarea" rows={2} value={f.desc || ''}
                onChange={(e) => update({ desc: e.target.value })} />
            </>
          )}
        />
      </SectionCard>

      {/* Process */}
      <SectionCard title="Process Steps">
        <ArraySection
          title="Steps"
          items={process}
          onChange={(v) => set('process', v)}
          addLabel="Add Step"
          onAdd={() => set('process', [...process, { step: String(process.length + 1).padStart(2, '0'), title: '', desc: '' }])}
          renderItem={(s, _i, update) => (
            <>
              <div className="grid grid-cols-4 gap-3">
                <FormField label="Step #" value={s.step || ''} onChange={(e) => update({ step: e.target.value })} />
                <div className="col-span-3">
                  <FormField label="Title" value={s.title || ''} onChange={(e) => update({ title: e.target.value })} />
                </div>
              </div>
              <FormField label="Description" type="textarea" rows={3} value={s.desc || ''}
                onChange={(e) => update({ desc: e.target.value })} />
            </>
          )}
        />
      </SectionCard>

      {/* Why Us */}
      <SectionCard title="Why Choose Us">
        <ArraySection
          title="Points"
          items={whyUs}
          onChange={(v) => set('whyUs', v)}
          addLabel="Add Point"
          onAdd={() => set('whyUs', [...whyUs, { icon: '', title: '', desc: '' }])}
          renderItem={(w, _i, update) => (
            <>
              <IconPicker label="Icon" value={w.icon} onChange={(v) => update({ icon: v })} />
              <FormField label="Title" value={w.title || ''} onChange={(e) => update({ title: e.target.value })} />
              <FormField label="Description" type="textarea" rows={2} value={w.desc || ''}
                onChange={(e) => update({ desc: e.target.value })} />
            </>
          )}
        />
      </SectionCard>

      {/* FAQs */}
      <SectionCard title="FAQs">
        <ArraySection
          title="Questions"
          items={faqs}
          onChange={(v) => set('faqs', v)}
          addLabel="Add FAQ"
          onAdd={() => set('faqs', [...faqs, { question: '', answer: '' }])}
          renderItem={(faq, _i, update) => (
            <>
              <FormField label="Question" value={faq.question || ''} onChange={(e) => update({ question: e.target.value })} />
              <FormField label="Answer" type="textarea" rows={3} value={faq.answer || ''}
                onChange={(e) => update({ answer: e.target.value })} />
            </>
          )}
        />
      </SectionCard>

      {/* Related Blogs */}
      <SectionCard title="Related Blog Slugs">
        <p className="text-xs text-subtle">Enter blog post slugs (one per row). These appear as related articles on the service page.</p>
        {relatedBlogs.map((slug, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <FormField label={`Blog slug ${i + 1}`} value={slug}
                onChange={(e) => {
                  const next = [...relatedBlogs]
                  next[i] = e.target.value
                  set('relatedBlogs', next)
                }} />
            </div>
            <button type="button" onClick={() => set('relatedBlogs', relatedBlogs.filter((_, idx) => idx !== i))}
              className="mt-5 p-1.5 text-subtle hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set('relatedBlogs', [...relatedBlogs, ''])}
          className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover self-start">
          <Plus className="w-3.5 h-3.5" /> Add Blog Slug
        </button>
      </SectionCard>

      {/* Challenges */}
      <SectionCard title="Challenges Section (wide image banner + card grid)">
        <p className="text-xs text-subtle -mt-1">Wide cinematic image at top with heading overlaid, then a numbered glass card grid below.</p>
        <FormField
          label="Section Heading"
          value={form.challenges?.heading || ''}
          onChange={(e) => set('challenges', { ...form.challenges, heading: e.target.value })}
          placeholder="What Challenges Does an eCommerce SEO Firm Solve?"
        />
        <FormField
          label="Subtext"
          type="textarea"
          rows={2}
          value={form.challenges?.subtext || ''}
          onChange={(e) => set('challenges', { ...form.challenges, subtext: e.target.value })}
        />
        <FormField
          label="Banner Image URL (Unsplash or upload URL)"
          value={form.challenges?.imageUrl || ''}
          onChange={(e) => set('challenges', { ...form.challenges, imageUrl: e.target.value })}
          placeholder="https://images.unsplash.com/photo-..."
        />
        {form.challenges?.imageUrl && (
          <div className="relative h-32 rounded-xl overflow-hidden border border-divider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.challenges.imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <ArraySection
          title="Challenge Points"
          items={form.challenges?.items || []}
          onChange={(v) => set('challenges', { ...form.challenges, items: v })}
          addLabel="Add Challenge"
          onAdd={() => set('challenges', {
            ...form.challenges,
            items: [...(form.challenges?.items || []), { icon: 'AlertCircle', title: '', desc: '' }],
          })}
          renderItem={(item, _i, update) => (
            <>
              <div className="grid grid-cols-2 gap-3">
                <IconPicker label="Icon" value={item.icon} onChange={(v) => update({ icon: v })} />
                <FormField label="Title" value={item.title || ''} onChange={(e) => update({ title: e.target.value })} />
              </div>
              <FormField label="Description" type="textarea" rows={2} value={item.desc || ''}
                onChange={(e) => update({ desc: e.target.value })} />
            </>
          )}
        />
      </SectionCard>

      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {loading ? 'Saving…' : 'Save Service'}
        </button>
      </div>
    </form>
  )
}
