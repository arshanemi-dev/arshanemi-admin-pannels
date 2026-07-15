// Seed data for the `coin_packages` table (scripts/seed.mjs) — the initial
// buy-pack catalog shown on /settings/plan. Coin/price figures carried over
// from this feature's original UI-first dummy data (the old data/coinPlans.js
// `coinPlans` array, whose "Experience" column is what validityDays replaces
// with a real, admin-editable field — see plan/my-payment-management.md).
// Fully admin-editable afterwards via Settings → Coin Packages — this file
// only seeds the first-run defaults, it isn't read at runtime.
export const coinPackages = [
  { name: 'Starter Pack',    coins: 500,   pricePaise: 50_000,    badge: null,           validityDays: 30,  displayOrder: 1, isActive: true },
  { name: 'Growth Pack',     coins: 1100,  pricePaise: 100_000,   badge: 'Most Popular', validityDays: 60,  displayOrder: 2, isActive: true },
  { name: 'Pro Pack',        coins: 6000,  pricePaise: 500_000,   badge: 'Best Value',   validityDays: 365, displayOrder: 3, isActive: true },
  { name: 'Business Pack',   coins: 28000, pricePaise: 2_000_000, badge: null,           validityDays: 365, displayOrder: 4, isActive: true },
  { name: 'Enterprise Pack', coins: 80000, pricePaise: 5_000_000, badge: null,           validityDays: 365, displayOrder: 5, isActive: true },
]
