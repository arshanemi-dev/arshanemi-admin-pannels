'use client'
import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'

const SOCIAL_PLATFORMS = [
  { label: 'Facebook',   icon: 'Facebook',      color: '#1877F2', placeholder: 'https://facebook.com/yourpage' },
  { label: 'Instagram',  icon: 'Instagram',     color: '#E4405F', placeholder: 'https://instagram.com/yourhandle' },
  { label: 'LinkedIn',   icon: 'Linkedin',      color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourcompany' },
  { label: 'Twitter',    icon: 'Twitter',       color: '#1DA1F2', placeholder: 'https://x.com/yourhandle' },
  { label: 'YouTube',    icon: 'Youtube',       color: '#FF0000', placeholder: 'https://youtube.com/@yourchannel' },
  { label: 'WhatsApp',   icon: 'MessageCircle', color: '#25D366', placeholder: 'https://wa.me/91xxxxxxxxxx' },
  { label: 'Telegram',   icon: 'Send',          color: '#26A5E4', placeholder: 'https://t.me/yourgroup' },
  { label: 'GitHub',     icon: 'Github',        color: '#333333', placeholder: 'https://github.com/yourorg' },
  { label: 'Pinterest',  icon: 'Pin',           color: '#E60023', placeholder: 'https://pinterest.com/yourprofile' },
]

function getPlatform(icon) {
  return SOCIAL_PLATFORMS.find((p) => p.icon === icon) || SOCIAL_PLATFORMS[0]
}

function PlatformIcon({ icon, color, size = 18 }) {
  const Icon = LucideIcons[icon]
  return Icon
    ? <Icon size={size} style={{ color }} />
    : <LucideIcons.Globe size={size} className="text-subtle" />
}

function SocialLinkRow({ link, index, onChange, onRemove }) {
  const platform = getPlatform(link.icon)

  function handlePlatformChange(e) {
    const selected = SOCIAL_PLATFORMS.find((p) => p.label === e.target.value)
    if (selected) onChange(index, { ...link, label: selected.label, icon: selected.icon })
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-divider">
      {/* Icon preview bubble */}
      <div
        className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
        style={{ backgroundColor: platform.color + '22' }}
      >
        <PlatformIcon icon={link.icon || 'Globe'} color={platform.color} />
      </div>

      {/* Platform selector */}
      <select
        value={link.label || ''}
        onChange={handlePlatformChange}
        className="text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent bg-card w-36 flex-shrink-0"
      >
        {SOCIAL_PLATFORMS.map((p) => (
          <option key={p.label} value={p.label}>{p.label}</option>
        ))}
      </select>

      {/* URL input */}
      <input
        type="url"
        value={link.href || ''}
        onChange={(e) => onChange(index, { ...link, href: e.target.value })}
        placeholder={platform.placeholder}
        className="flex-1 text-sm border border-divider rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-subtle hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
      >
        <LucideIcons.Trash2 size={15} />
      </button>
    </div>
  )
}

function FooterPreview({ socialLinks }) {
  if (!socialLinks.length) return null
  return (
    <div className="rounded-xl border border-divider overflow-hidden">
      <div className="px-4 py-2 bg-surface border-b border-divider flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-subtle" />
        <span className="text-xs font-medium text-subtle uppercase tracking-widest">Footer Preview</span>
      </div>
      <div className="bg-[#0a0a0a] px-6 py-5">
        <p className="text-[11px] text-muted mb-3">Social icons shown in footer brand column</p>
        <div className="flex gap-2 flex-wrap">
          {socialLinks.map((s, i) => {
            const Icon = LucideIcons[s.icon]
            const platform = getPlatform(s.icon)
            return (
              <div
                key={i}
                title={s.label}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-700 text-subtle hover:border-gray-500 transition-colors cursor-default"
              >
                {Icon ? <Icon size={15} /> : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function NavigationPage() {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetch('/api/admin/singleton/navigation').then((r) => r.json()).then(setForm)
  }, [])

  if (!form) return <div className="text-subtle text-sm p-6">Loading…</div>

  const socialLinks = form.socialLinks || []

  function updateLink(index, updated) {
    const sl = [...socialLinks]
    sl[index] = updated
    setForm((f) => ({ ...f, socialLinks: sl }))
  }

  function removeLink(index) {
    setForm((f) => ({ ...f, socialLinks: socialLinks.filter((_, i) => i !== index) }))
  }

  function addLink(platform) {
    const sl = [...socialLinks, { label: platform.label, icon: platform.icon, href: '' }]
    setForm((f) => ({ ...f, socialLinks: sl }))
  }

  async function save(e) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/singleton/navigation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) addToast('Navigation saved!')
    else addToast('Save failed', 'error')
    setLoading(false)
  }

  const usedLabels = socialLinks.map((l) => l.label)
  const available = SOCIAL_PLATFORMS.filter((p) => !usedLabels.includes(p.label))

  return (
    <form onSubmit={save} className="max-w-3xl mx-auto">
      <PageHeader title="Navigation" description="Manage social media links shown in the footer" />

      <div className="bg-card rounded-2xl border border-divider shadow-sm p-6 flex flex-col gap-6">

        {/* Social Links */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Social Links</h3>
              <p className="text-xs text-subtle mt-0.5">Select a platform, paste the URL. Changes appear in the footer instantly after saving.</p>
            </div>
          </div>

          {/* Add platform chips */}
          {available.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-surface rounded-xl border border-dashed border-divider">
              <span className="text-xs text-subtle self-center mr-1">Add:</span>
              {available.map((p) => {
                const Icon = LucideIcons[p.icon]
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => addLink(p)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-divider bg-card hover:border-accent hover:bg-accent/10 text-muted hover:text-accent-hover transition-all shadow-sm"
                  >
                    {Icon && <Icon size={13} style={{ color: p.color }} />}
                    {p.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Existing links */}
          {socialLinks.length === 0 ? (
            <div className="text-center py-10 text-sm text-subtle border border-dashed border-divider rounded-xl">
              No social links yet. Click a platform above to add one.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {socialLinks.map((link, i) => (
                <SocialLinkRow key={i} link={link} index={i} onChange={updateLink} onRemove={removeLink} />
              ))}
            </div>
          )}
        </div>

        {/* Live footer preview */}
        <FooterPreview socialLinks={socialLinks} />

        <div className="flex justify-end pt-2 border-t border-divider">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            {loading ? 'Saving…' : 'Save Navigation'}
          </button>
        </div>
      </div>
    </form>
  )
}
