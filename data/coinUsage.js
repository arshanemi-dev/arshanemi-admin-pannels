// Dummy per-tool coin usage report shown on Settings → Profile → "Coin
// Use" tab for the plain 'user' role. Keyed by time range so the dropdown
// is functionally meaningful. Replace with real tools_usage_history
// aggregates once that table exists (see plan/my-payment-management.md).
//
// Named coinUsage (not tokenUsage) deliberately — "token" is reserved
// elsewhere in this codebase for JWT auth tokens (lib/auth.js,
// lib/tokenStore.js, app/api/auth/*). Reusing it here for an unrelated
// concept (coin consumption) was a naming collision; see the "Naming"
// section in plan/my-payment-management.md.
export const COIN_USE_RANGES = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'all-time', label: 'All Time' },
]

export const coinUsageByRange = {
  'this-month': {
    total: 600,
    tools: [
      { name: 'Tool 1', coinUse: 50 },
      { name: 'Tool 2', coinUse: 120 },
      { name: 'Tool 3', coinUse: 250 },
      { name: 'Tool 4', coinUse: 60 },
      { name: 'Tool 5', coinUse: 20 },
      { name: 'Tool 6', coinUse: 75 },
    ],
  },
  'last-month': {
    total: 430,
    tools: [
      { name: 'Tool 1', coinUse: 40 },
      { name: 'Tool 2', coinUse: 95 },
      { name: 'Tool 3', coinUse: 180 },
      { name: 'Tool 4', coinUse: 45 },
      { name: 'Tool 5', coinUse: 15 },
      { name: 'Tool 6', coinUse: 55 },
    ],
  },
  'all-time': {
    total: 2140,
    tools: [
      { name: 'Tool 1', coinUse: 310 },
      { name: 'Tool 2', coinUse: 540 },
      { name: 'Tool 3', coinUse: 620 },
      { name: 'Tool 4', coinUse: 280 },
      { name: 'Tool 5', coinUse: 140 },
      { name: 'Tool 6', coinUse: 250 },
    ],
  },
}
