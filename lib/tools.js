import { unstable_cache } from 'next/cache'
import { getAllToolsFromDB } from '@/lib/db'
import { tools as staticTools } from '@/data/tools'

// Same cache tag ('tools') as before the table migration, so the existing
// revalidateTag('tools') calls in app/api/admin/tools/*/route.js still
// invalidate this without any changes there.
const getCachedTools = unstable_cache(
  () => getAllToolsFromDB(),
  ['tools'],
  { tags: ['tools'], revalidate: 3600 }
)

export async function getAllTools() {
  try {
    const db = await getCachedTools()
    return db.length ? db : staticTools
  } catch {
    return staticTools
  }
}

export async function getTool(slug) {
  const all = await getAllTools()
  return all.find((t) => t.slug === slug) ?? null
}

// Looks up one billable feature by its apiIdentifier — the contract external
// tool apps call against (see plan/my-payment-management.md §7). Rides the
// same unstable_cache('tools') as getAllTools/getTool, so pricing edits made
// through the tools-catalog admin form (which calls revalidateTag('tools'))
// are picked up without an extra DB round-trip per deduct call.
export async function getToolFeature(slug, apiIdentifier) {
  const tool = await getTool(slug)
  if (!tool) return { tool: null, feature: null }
  const feature = (tool.features || []).find((f) => f.apiIdentifier === apiIdentifier)
  return { tool, feature: feature ?? null }
}

// Groups tools' billable features into the shape CoinsUsageTable expects
// (productName → tool title, variants[] → priced features) — shared by
// /settings/plan (logged-in staff/user) and the public /plan page. Only
// tools with at least one active, priced feature show up.
export function buildUsageRateGroups(tools) {
  return tools
    .map((tool) => {
      const variants = (tool.features || [])
        .filter((f) => f.isActive && f.coinCost > 0)
        .map((f) => ({ name: f.title, fixFees: 0, coinCost: `${f.coinCost} Coin${f.coinCost === 1 ? '' : 's'}` }))
      return variants.length ? { id: tool.slug, productName: tool.title, variants } : null
    })
    .filter(Boolean)
}
