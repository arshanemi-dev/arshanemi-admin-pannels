import { getAllToolsFromDB, getUserSettings } from '@/lib/db'
import { defaultToolsAccessByRole } from '@/data/tools'

export { buildUsageRateGroups } from '@/lib/toolPricing'

// No caching layer — every call hits the `tools` table directly, so admin
// edits and direct DB inserts show up immediately with no revalidation step.
// An empty table means no tools have been created yet, so this returns []
// rather than masking that with data/tools.js's hardcoded sample catalog.
export async function getAllTools() {
  try {
    return await getAllToolsFromDB()
  } catch (err) {
    console.error('getAllTools: failed to load tools from DB', err)
    return []
  }
}

export async function getTool(slug) {
  const all = await getAllTools()
  return all.find((t) => t.slug === slug) ?? null
}

// Resolves which tool slugs a user is granted — the per-user `tools_access`
// row if one exists, else the role's default grant (data/tools.js). Shared by
// /api/tools/my and the tool-use-page access gate (lib/toolAccess.js) so the
// two never drift apart.
export async function getUserToolsAccess(userId, role) {
  const settings = await getUserSettings(userId)
  return settings?.tools_access ?? defaultToolsAccessByRole[role] ?? defaultToolsAccessByRole.user
}

// Looks up one billable feature by its apiIdentifier — the contract external
// tool apps call against (see plan/my-payment-management.md §7).
export async function getToolFeature(slug, apiIdentifier) {
  const tool = await getTool(slug)
  if (!tool) return { tool: null, feature: null }
  const feature = (tool.features || []).find((f) => f.apiIdentifier === apiIdentifier)
  return { tool, feature: feature ?? null }
}
