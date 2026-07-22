'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import FormField from '@/components/admin/FormField'
import IconPicker from '@/components/admin/IconPicker'
import { useToast } from '@/components/admin/Toast'

const TOOL_CATEGORIES = [
  { id: 'research',   label: 'Research Tools' },
  { id: 'analytics',  label: 'Analytics Tools' },
  { id: 'listing',    label: 'Listing Tools' },
  { id: 'embedded',   label: 'Embedded Tools' },
]

const FEATURE_ICON_OPTIONS = [
  'Search', 'Eye', 'Calculator', 'Tag', 'LineChart', 'TrendingUp',
  'BarChart3', 'Package', 'DollarSign', 'Target', 'Zap', 'Globe',
  'Wrench', 'Star', 'ShieldCheck',
]

function autoSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isValidUrl(value) {
  if (!value) return true // optional field
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Shared form body for both /settings/tools-catalog/new and /[id] — one
// in-page form (no modal) with product details always visible, and the
// Features & Pricing editor tucked behind an "Advanced Settings" toggle so a
// tool with several priced features doesn't turn the page into a wall of
// inputs. Defaults open when editing a tool that already has features, so
// existing pricing is never hidden behind an extra click.
export default function ToolForm({ initialForm, onSubmit, loading, submitLabel, heading, backHref = '/settings/tools-catalog' }) {
  const { addToast } = useToast()
  const [form, setForm] = useState(initialForm)
  const [urlError, setUrlError] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState((initialForm.features || []).length > 0)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function addFeature() {
    setForm((f) => ({
      ...f,
      features: [
        ...(f.features || []),
        { id: `feature-${Date.now()}`, icon: 'Star', title: '', desc: '', apiIdentifier: '', coinCost: 0, fixFeeCoins: 0, isActive: false },
      ],
    }))
    setAdvancedOpen(true)
  }

  function updateFeature(index, key, value) {
    setForm((f) => {
      const features = [...f.features]
      const row = { ...features[index], [key]: value }
      if (key === 'title') row.id = autoSlug(value) || row.id
      features[index] = row
      return { ...f, features }
    })
  }

  function removeFeature(index) {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim()) {
      addToast('Title and slug are required', 'error'); return
    }
    if (!isValidUrl(form.toolUrl)) {
      setUrlError('Enter a valid http:// or https:// URL')
      return
    }
    for (const feature of form.features || []) {
      // Coin Cost is allowed to be 0 — a feature can be active and free
      // (e.g. core navigation), it just skips the deduct call entirely.
      // An apiIdentifier is still required so tool apps and
      // /api/wallet/deduct have something to match the feature on.
      if (feature.isActive && !feature.apiIdentifier?.trim()) {
        addToast(`"${feature.title || 'Untitled feature'}" is Active but needs an API Identifier`, 'error')
        setAdvancedOpen(true)
        return
      }
    }

    onSubmit({
      ...form,
      features: (form.features || []).map((f) => ({
        ...f,
        coinCost: Math.max(0, +f.coinCost || 0),
        fixFeeCoins: Math.max(0, Math.round(+f.fixFeeCoins || 0)),
        apiIdentifier: f.apiIdentifier?.trim() || null,
      })),
    })
  }

  const featureCount = (form.features || []).length

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-10">
      <PageHeader title={heading} backHref={backHref} />
      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Title" name="title" required value={form.title}
            onChange={(e) => setForm((f) => ({
              ...f,
              title: e.target.value,
              slug: f.slug || autoSlug(e.target.value),
            }))}
            placeholder="e.g. Product Research Tool"
          />
          <FormField label="Slug" name="slug" required value={form.slug} onChange={handle} placeholder="product-research" className="font-mono" />
        </div>

        <FormField label="Short Description" name="shortDesc" type="textarea" rows={3} value={form.shortDesc} onChange={handle}
          placeholder="One sentence describing this tool…" />

        <div className="grid grid-cols-2 gap-4">
          <IconPicker label="Icon" value={form.icon} onChange={(v) => set('icon', v)} />
          <FormField label="Category" name="category" type="select" value={form.category} onChange={handle}
            options={TOOL_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
        </div>

        <FormField label="Badge (optional)" name="badge" value={form.badge} onChange={handle} placeholder="e.g. New, Beta, Most Popular" />

        <FormField
          label="Tool URL (optional — embeds this tool in an iframe)" name="toolUrl" value={form.toolUrl}
          onChange={handle}
          onBlur={() => setUrlError(isValidUrl(form.toolUrl) ? '' : 'Enter a valid http:// or https:// URL')}
          placeholder="https://your-tool-app.example.com"
          error={urlError}
          hint={!urlError ? 'When set, a "Use Tool" button appears on the tools grid and detail page, opening this URL in an iframe. The target site must allow iframe embedding.' : undefined}
        />

        <div className="flex items-center justify-between rounded-xl border border-divider px-4 py-3">
          <div>
            <p className="text-sm font-medium text-muted">Require Login</p>
            <p className="text-xs text-subtle">Visitors must sign in before the embedded tool loads.</p>
          </div>
          <FormField type="toggle" name="requiresLogin" value={form.requiresLogin} onChange={handle} />
        </div>

        {/* Advanced Settings — Features & Pricing, collapsed by default for a
            brand-new tool, auto-expanded when editing one that already has
            features so existing pricing is never hidden. */}
        <div className="rounded-xl border border-divider">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium text-muted">Advanced Settings — Features &amp; Pricing</p>
              <p className="text-xs text-subtle">{featureCount} feature{featureCount === 1 ? '' : 's'} configured</p>
            </div>
            {advancedOpen ? <ChevronDown className="w-4 h-4 text-subtle shrink-0" /> : <ChevronRight className="w-4 h-4 text-subtle shrink-0" />}
          </button>

          {advancedOpen && (
            <div className="border-t border-divider">
              <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
                <p className="text-xs text-subtle max-w-sm">Active features are billable — external tool apps deduct coins against them, and can also require a recurring monthly Activation charge.</p>
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>

              {featureCount === 0 ? (
                <p className="text-xs text-subtle px-4 py-4">No features yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-divider">
                  {form.features.map((feature, index) => (
                    <div key={feature.id || index} className="p-4 flex flex-col gap-3">
                      <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                        <input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          placeholder="Feature title"
                          className="admin-input"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-subtle hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        value={feature.desc}
                        onChange={(e) => updateFeature(index, 'desc', e.target.value)}
                        placeholder="Feature description"
                        rows={2}
                        className="admin-input resize-none"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={feature.icon}
                          onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                          className="admin-input"
                        >
                          {FEATURE_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <input
                          value={feature.apiIdentifier || ''}
                          onChange={(e) => updateFeature(index, 'apiIdentifier', e.target.value)}
                          placeholder="API identifier (e.g. crop-batch)"
                          className="admin-input font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-subtle">Coin Cost</label>
                          <input
                            type="number"
                            min={0}
                            value={feature.coinCost}
                            onChange={(e) => updateFeature(index, 'coinCost', e.target.value)}
                            className="admin-input"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-subtle">Activation (Coins/mo)</label>
                          <input
                            type="number"
                            min={0}
                            value={feature.fixFeeCoins || 0}
                            onChange={(e) => updateFeature(index, 'fixFeeCoins', Math.round(+e.target.value || 0))}
                            className="admin-input"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <label className="text-xs text-subtle">Active</label>
                          <FormField type="toggle" name="isActive" value={feature.isActive}
                            onChange={(e) => updateFeature(index, 'isActive', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>

      <style jsx>{`
        .admin-input {
          width: 100%;
          border: 1px solid var(--color-divider);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          background: var(--color-card);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.12);
        }
      `}</style>
    </form>
  )
}
