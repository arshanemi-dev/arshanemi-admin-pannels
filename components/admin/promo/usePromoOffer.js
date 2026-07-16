'use client'
import { useCallback, useEffect, useState } from 'react'
import { defaultPromoOffer } from '@/data/promoOffer'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// 'disabled' | 'scheduled' | 'active' | 'expired' — distinct from the raw
// `enabled` flag, since an enabled offer can still be scheduled for the
// future or already past its end date.
export function getPromoStatus(offer) {
  if (!offer?.enabled) return 'disabled'
  const today = todayIso()
  if (offer.startDate && today < offer.startDate) return 'scheduled'
  if (offer.endDate && today > offer.endDate) return 'expired'
  return 'active'
}

// Reads/writes the promo offer config from the `promoOffer` singleton in
// layout_settings via /api/admin/singleton/promoOffer (same generic
// singleton route used for theme/company/stats/etc). Seeded from
// data/promoOffer.js's defaultPromoOffer — see scripts/seed.mjs. Falls back
// to those defaults if the fetch fails so the badge still renders something
// sane offline/mid-outage.
export function usePromoOffer() {
  const [offer, setOffer] = useState(defaultPromoOffer)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/singleton/promoOffer')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setOffer((prev) => ({ ...prev, ...data }))
      })
      .catch(() => {
        // API unavailable — keep defaults
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  const updateOffer = useCallback(async (patch) => {
    const next = { ...offer, ...patch }
    const res = await fetch('/api/admin/singleton/promoOffer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    if (!res.ok) throw new Error('Failed to save promo offer')
    setOffer(next)
    return next
  }, [offer])

  const status = getPromoStatus(offer)
  return { offer, updateOffer, loaded, status, active: status === 'active' }
}
