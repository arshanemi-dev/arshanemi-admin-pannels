// Dummy per-tool credit usage report shown on Settings → Profile → "Token
// Use" tab for the plain 'user' role. Keyed by time range so the dropdown
// is functionally meaningful. Replace with real tools_usage_history
// aggregates once that table exists (see plan/my-payment-management.md).
export const TOKEN_USE_RANGES = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'all-time', label: 'All Time' },
]

export const tokenUsageByRange = {
  'this-month': {
    total: 600,
    tools: [
      { name: 'Tool 1', creditUse: 50 },
      { name: 'Tool 2', creditUse: 120 },
      { name: 'Tool 3', creditUse: 250 },
      { name: 'Tool 4', creditUse: 60 },
      { name: 'Tool 5', creditUse: 20 },
      { name: 'Tool 6', creditUse: 75 },
    ],
  },
  'last-month': {
    total: 430,
    tools: [
      { name: 'Tool 1', creditUse: 40 },
      { name: 'Tool 2', creditUse: 95 },
      { name: 'Tool 3', creditUse: 180 },
      { name: 'Tool 4', creditUse: 45 },
      { name: 'Tool 5', creditUse: 15 },
      { name: 'Tool 6', creditUse: 55 },
    ],
  },
  'all-time': {
    total: 2140,
    tools: [
      { name: 'Tool 1', creditUse: 310 },
      { name: 'Tool 2', creditUse: 540 },
      { name: 'Tool 3', creditUse: 620 },
      { name: 'Tool 4', creditUse: 280 },
      { name: 'Tool 5', creditUse: 140 },
      { name: 'Tool 6', creditUse: 250 },
    ],
  },
}
