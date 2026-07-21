/**
 * sync-tool-pricing.mjs — one-off: push data/tools.js's `features[]` pricing
 * into the live DB `tools` table.
 * Run with: node --env-file=.env scripts/sync-tool-pricing.mjs
 *
 * lib/tools.js's getAllTools() reads the live DB `tools` table as the actual
 * source of truth in production — data/tools.js is only a fallback used when
 * the DB query fails or the table is empty. Editing data/tools.js alone
 * doesn't change what's served, so this script pushes the updated pricing
 * (coinCost/fixFeePaise on each feature) into the DB row for each tool,
 * matched by slug. Only `content.features` is overwritten — every other
 * content field (hero/stats/steps/advantages/faqs) already live in the DB is
 * preserved, matching app/api/admin/tools/[id]/route.js's updateTool()
 * merge-not-replace semantics for the `content` column.
 *
 * Safe to re-run — always just re-applies the current data/tools.js state.
 */

import { createClient } from '@supabase/supabase-js'
import { tools } from '../data/tools.js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key)
}

async function syncTool(supabase, tool) {
  const { data: existing, error: fetchError } = await supabase
    .from('tools')
    .select('id, content')
    .eq('slug', tool.slug)
    .maybeSingle()

  if (fetchError) {
    console.error(`[sync] Could not fetch "${tool.slug}":`, fetchError.message)
    return
  }
  if (!existing) {
    console.warn(`[sync] No live DB row for slug "${tool.slug}" — skipping (create it via Settings → Tools Catalog first)`)
    return
  }

  const mergedContent = { ...(existing.content ?? {}), features: tool.features }
  const { error: updateError } = await supabase
    .from('tools')
    .update({ content: mergedContent, updated_at: new Date().toISOString() })
    .eq('id', existing.id)

  if (updateError) {
    console.error(`[sync] Could not update "${tool.slug}":`, updateError.message)
    return
  }
  console.log(`[sync] ✓ "${tool.slug}" — ${tool.features.length} feature(s) synced`)
}

async function run() {
  const supabase = getSupabase()
  for (const tool of tools) {
    await syncTool(supabase, tool)
  }
  console.log('[sync] Done. Tools Catalog cache revalidates within the hour — or open Settings → Tools Catalog and re-save any tool to invalidate it immediately.')
}

run()
