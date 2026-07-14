'use client'
import { useState } from 'react'
import { BadgePercent, Clock, Copy, Check } from 'lucide-react'
import { usePromoOffer } from './usePromoOffer'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Promo badge shown at the top of /settings/plan. Reads the live persisted
// offer by default; pass `offer`/`active` to preview an unsaved draft
// instead (used by PromoOfferForm's admin preview). `previewMode` renders
// even when inactive, with a "not live" ribbon, so an admin can see the
// styling of a disabled/scheduled/expired offer before publishing it.
export default function PromoBadge({ offer: offerProp, active: activeProp, previewMode = false }) {
  const hook = usePromoOffer()
  const offer = offerProp ?? hook.offer
  const active = activeProp ?? hook.active
  const loaded = offerProp ? true : hook.loaded
  const [copied, setCopied] = useState(false)

  if (!loaded) return null
  if (!active && !previewMode) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(offer.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — code is still visible to copy by hand
    }
  }

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#f43f5e] to-[#fb923c] px-6 py-5 flex flex-wrap items-center justify-between gap-5">
      {previewMode && !active && (
        <span className="absolute top-2 right-2 text-[10px] font-bold text-white/90 bg-black/20 rounded px-2 py-0.5">
          PREVIEW — not live
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <BadgePercent className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-white">{offer.title}</p>
            <span className="text-xs font-bold text-[#f43f5e] bg-white rounded-full px-2.5 py-0.5">
              {offer.discountPercent}% OFF
            </span>
          </div>
          {offer.description && <p className="text-sm text-white/90 mt-0.5">{offer.description}</p>}
          <p className="text-xs text-white/75 mt-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Ends {formatDate(offer.endDate)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2.5 text-white text-sm font-semibold transition-colors flex-shrink-0"
      >
        <span className="text-white/80 font-normal">Code</span>
        <span className="font-mono tracking-wide">{offer.referralCode}</span>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}
