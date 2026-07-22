// Groups tools' billable features into the shape CoinsUsageTable expects
// (productName → tool title, variants[] → priced features) — shared by
// /settings/plan (logged-in staff/user) and the public /plan page. Only
// tools with at least one active feature show up; free features (coinCost 0)
// still show up too, labeled "Free", rather than being hidden.
//
// Pure/client-safe on purpose — lib/tools.js pulls in next/cache +
// lib/db.js (server-only), so app/settings/plan/page.js (a client
// component) can't import from there without breaking the client bundle.
export function buildUsageRateGroups(tools) {
  return tools
    .map((tool) => {
      const variants = (tool.features || [])
        .filter((f) => f.isActive)
        .map((f) => ({
          name: f.title,
          desc: f.desc,
          fixFees: f.fixFeeCoins > 0 ? `${f.fixFeeCoins} Coins/mo` : 'Free',
          coinCost: `${f.coinCost} Coin${f.coinCost === 1 ? '' : 's'}`,
        }))
      return variants.length ? { id: tool.slug, productName: tool.title, variants } : null
    })
    .filter(Boolean)
}
