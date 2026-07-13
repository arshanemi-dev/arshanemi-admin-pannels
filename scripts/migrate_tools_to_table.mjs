/**
 * One-time backfill: copy the 'tools' JSONB blob out of layout_settings and
 * into the new dedicated `tools` table (see scripts/tools_table_migration.sql
 * — run that SQL in the Supabase SQL Editor first, this script will fail if
 * the table doesn't exist yet).
 *
 * Safe to re-run — upserts by id, so existing rows just get overwritten with
 * the same data rather than duplicated. Does NOT touch user_settings /
 * tools_access (Tools Access grants) or the layout_settings row itself.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate_tools_to_table.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return createClient(url, key)
}

// Rich, variable-shape marketing content — bundled into the `content` JSONB
// column rather than split into more columns/tables (never queried by its
// inner fields, only ever rendered whole on the /tools/[slug] page).
const CONTENT_FIELDS = ['features', 'hero', 'stats', 'steps', 'advantages', 'faqs']

function toRow(item) {
  const content = {}
  for (const key of CONTENT_FIELDS) if (item[key] !== undefined) content[key] = item[key]
  return {
    id: item.id || nanoid(),
    slug: item.slug,
    title: item.title,
    icon: item.icon ?? null,
    short_desc: item.shortDesc ?? null,
    category: item.category ?? null,
    badge: item.badge ?? null,
    tool_url: item.toolUrl ?? null,
    requires_login: !!item.requiresLogin,
    content,
  }
}

async function main() {
  const supabase = getSupabase()

  const { data: setting, error: readError } = await supabase
    .from('layout_settings')
    .select('value')
    .eq('key', 'tools')
    .single()

  if (readError || !setting) {
    console.log('ℹ️  No existing layout_settings row for key "tools" — nothing to migrate.')
    return
  }

  const items = Array.isArray(setting.value) ? setting.value : []
  if (!items.length) {
    console.log('ℹ️  layout_settings "tools" blob is empty — nothing to migrate.')
    return
  }

  const rows = items.map(toRow)
  const { error: insertError } = await supabase.from('tools').upsert(rows, { onConflict: 'id' })
  if (insertError) throw new Error(`Failed to insert tools: ${insertError.message}`)

  console.log(`✓ Migrated ${rows.length} tool(s) into the tools table:`)
  rows.forEach((r) => console.log(`  - ${r.slug} (${r.title})`))
  console.log('\nNote: the old layout_settings "tools" row was left untouched.')
  console.log('Once you\'ve verified /settings/tools-catalog and /tools look correct, you can delete it manually:')
  console.log("  DELETE FROM layout_settings WHERE key = 'tools';")
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
