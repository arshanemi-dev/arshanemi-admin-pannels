// Deterministic dummy daily coin-usage generator for the per-customer
// Report drill-down (Settings → Customer Dashboard → click a row's "Report").
// "Work smartly with dummy data": rather than hand-writing a usage curve for
// every (customer × tool × time-range) combination, this seeds a small PRNG
// off those inputs — same selection always renders the same curve (no
// flicker on re-render or between sessions), without a giant static table.

export const REPORT_RANGES = [
  { id: 'all-time', label: 'All Time', days: 180 },
  { id: 'today', label: 'Today', days: 1 },
  { id: '7-days', label: '7 Days', days: 7 },
  { id: '30-days', label: 'Last 30 Days', days: 30 },
]

export const TOOL_FILTER_OPTIONS = [
  { value: 'all', label: 'All Tools' },
  { value: 'PDF Crop', label: 'PDF Crop' },
  { value: 'Background Remove', label: 'Background Remove' },
  { value: 'Listing', label: 'Listing' },
  { value: 'Profit-Loss', label: 'Profit-Loss' },
  { value: 'Link Generator', label: 'Link Generator' },
]

// mulberry32 — tiny, fast, deterministic PRNG. Good enough for dummy data;
// not for anything security-sensitive.
function mulberry32(seed) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0
  return h
}

const TOOL_WEIGHT = { all: 1, 'PDF Crop': 0.28, 'Background Remove': 0.22, Listing: 0.2, 'Profit-Loss': 0.14, 'Link Generator': 0.16 }

/**
 * Returns { totalCoins, points: [{ label, value }] } for one customer, one
 * tool filter, over `days` days (or an explicit `from`/`to` custom range).
 * Deterministic: identical arguments always produce identical output.
 */
export function getUsageTrend({ userId, tool = 'all', days, from, to }) {
  let spanDays = days
  if (from && to) {
    const ms = new Date(to) - new Date(from)
    spanDays = ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 0
  }
  if (!spanDays) return { totalCoins: null, points: [] }

  const seed = hashSeed(`${userId}:${tool}:${spanDays}:${from ?? ''}:${to ?? ''}`)
  const rand = mulberry32(seed)
  const weight = TOOL_WEIGHT[tool] ?? 0.18

  // Sample down to a readable curve — a 180-day range still renders ~7 points.
  const pointCount = spanDays <= 1 ? 6 : Math.min(spanDays, 7)
  const base = (18 + rand() * 12) * weight * (tool === 'all' ? 1 : 1)
  const scaleByRange = Math.max(1, Math.log2(spanDays + 1)) // longer ranges accumulate more

  const points = Array.from({ length: pointCount }, (_, i) => {
    const t = pointCount === 1 ? 0 : i / (pointCount - 1)
    const arc = Math.sin(t * Math.PI) // rises then falls — one smooth peak
    const noise = (rand() - 0.5) * base * 0.4
    const value = Math.max(2, Math.round((base * 0.6 + arc * base * scaleByRange * 0.5) + noise))
    return { label: `P${i + 1}`, value }
  })

  const totalCoins = points.reduce((sum, p) => sum + p.value, 0)
  return { totalCoins, points }
}
