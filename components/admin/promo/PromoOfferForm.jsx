'use client'
import { useState } from 'react'
import FormField from '@/components/admin/FormField'
import { useToast } from '@/components/admin/Toast'
import { getPromoStatus } from './usePromoOffer'
import PromoBadge from './PromoBadge'

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-700',
  expired: 'bg-red-50 text-red-700',
  disabled: 'bg-surface text-subtle',
}

const STATUS_LABELS = {
  active: 'Active now',
  scheduled: 'Scheduled',
  expired: 'Expired',
  disabled: 'Disabled',
}

// Edit form + live preview for the Plan page's promo badge. `offer` is the
// already-loaded, persisted value from usePromoOffer — the parent page only
// mounts this once loading finishes, so the initial useState below always
// captures the real saved value (never a not-yet-loaded default).
export default function PromoOfferForm({ offer, updateOffer }) {
  const { addToast } = useToast()
  const [draft, setDraft] = useState(offer)

  function set(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    try {
      await updateOffer(draft)
      addToast('Promo offer saved')
    } catch {
      addToast('Failed to save promo offer', 'error')
    }
  }

  const draftStatus = getPromoStatus(draft)

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card rounded-2xl border border-divider p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Offer Details</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[draftStatus]}`}>
            {STATUS_LABELS[draftStatus]}
          </span>
        </div>

        <FormField label="Enabled" name="enabled" type="toggle" value={draft.enabled} onChange={(e) => set('enabled', e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            label="Title" name="title" value={draft.title}
            onChange={(e) => set('title', e.target.value)} placeholder="Limited Time Offer"
          />
          <FormField
            label="Referral Code" name="referralCode" value={draft.referralCode}
            onChange={(e) => set('referralCode', e.target.value.toUpperCase())} placeholder="SAVE10"
          />
          <FormField
            label="Discount %" name="discountPercent" type="number" min={0} max={100}
            value={draft.discountPercent}
            onChange={(e) => set('discountPercent', Math.max(0, Math.min(100, +e.target.value || 0)))}
          />
          <div className="hidden sm:block" />
          <FormField
            label="Start Date" name="startDate" type="date"
            value={draft.startDate} onChange={(e) => set('startDate', e.target.value)}
          />
          <FormField
            label="End Date" name="endDate" type="date"
            value={draft.endDate} onChange={(e) => set('endDate', e.target.value)}
          />
        </div>

        <FormField
          label="Description" name="description" type="textarea" rows={2}
          value={draft.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Recharge before the offer ends and save on every coin plan."
        />

        <button
          type="button"
          onClick={handleSave}
          className="self-end px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Preview — how this looks on the Plan page</h3>
        <PromoBadge offer={draft} active={draftStatus === 'active'} previewMode />
      </div>
    </div>
  )
}
