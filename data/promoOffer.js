// Default promo offer shown as a badge on the Plan page and editable from
// Settings → Promo Offers. This is the seed value for the `promoOffer`
// singleton in layout_settings (see scripts/seed.mjs) — components/admin/promo's
// usePromoOffer hook reads/writes the live value via
// /api/admin/singleton/promoOffer, falling back to this default if that
// fetch fails.
export const defaultPromoOffer = {
  enabled: true,
  title: 'Limited Time Offer',
  description: 'Recharge before the offer ends and save on every coin plan.',
  discountPercent: 10,
  referralCode: 'SAVE10',
  startDate: '2026-07-01',
  endDate: '2026-07-31',
}
