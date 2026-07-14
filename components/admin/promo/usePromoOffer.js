'use client'
import { useCallback, useEffect, useState } from 'react'
import { defaultPromoOffer } from '@/data/promoOffer'

const STORAGE_KEY = 'arshanemi_promo_offer'

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

// Reads/writes the promo offer config from localStorage — no backend for
// this yet (see plan/my-payment-management.md for the coin-wallet system
// this sits beside). Falls back to data/promoOffer.js defaults on first
// load or if storage is unavailable/corrupt, so it degrades gracefully.
export function usePromoOffer() {
  const [offer, setOffer] = useState(defaultPromoOffer)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setOffer((prev) => ({ ...prev, ...JSON.parse(raw) }))
    } catch {
      // corrupt/unavailable storage — keep defaults
    } finally {
      setLoaded(true)
    }
  }, [])

  const updateOffer = useCallback((patch) => {
    setOffer((prev) => {
      const next = { ...prev, ...patch }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable — edit still applies for this session
      }
      return next
    })
  }, [])

  const status = getPromoStatus(offer)
  return { offer, updateOffer, loaded, status, active: status === 'active' }
}
