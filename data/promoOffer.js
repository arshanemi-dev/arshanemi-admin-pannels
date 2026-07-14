// Default promo offer shown as a badge on the Plan page and editable from
// Settings → Promo Offers. No backend for this yet — components/admin/promo's
// usePromoOffer hook persists edits to localStorage so admin changes survive
// a refresh without needing a migration.
export const defaultPromoOffer = {
  enabled: true,
  title: 'Limited Time Offer',
  description: 'Recharge before the offer ends and save on every coin plan.',
  discountPercent: 10,
  referralCode: 'SAVE10',
  startDate: '2026-07-01',
  endDate: '2026-07-31',
}
