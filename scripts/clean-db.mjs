/**
 * Arshanemi — Full Database Reset
 * Deletes every row from every table this app owns. Irreversible. Meant to
 * reset a dev/staging Supabase project to empty before re-running
 * `npm run seed`. NEVER point this at a production project's .env.
 *
 * Usage:
 *   node --env-file=.env scripts/clean-db.mjs          (interactive confirm)
 *   node --env-file=.env scripts/clean-db.mjs --yes    (skip prompt, for CI)
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return { client: createClient(url, key), url }
}

// Child tables first, so FK references (ON DELETE CASCADE/SET NULL) never
// block a parent delete — see scripts/schema.sql, wallet_system_migration.sql,
// feature_activation_migration.sql, and storage_billing_migration.sql for the
// actual constraints this order respects.
const TABLES_IN_DELETE_ORDER = [
  'feature_activations',
  'storage_usage_events',
  'user_storage_usage',
  'tools_usage_history',
  'wallet_topups',
  'user_otp',
  'user_settings',
  'users',
  'companies',
  'coin_packages',
  'tools',
  'files_expiry',
  'layout_settings',
]

// feature_activations and user_storage_usage have no `id` column at all —
// they're keyed by a composite PRIMARY KEY (see
// feature_activation_migration.sql / storage_billing_migration.sql), so the
// default `id`-based filter below would 400 on them. user_id is NOT NULL on
// both and safely matches every row instead.
const DELETE_FILTER_COLUMN = {
  feature_activations: 'user_id',
  user_storage_usage: 'user_id',
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer) }))
}

async function wipeTable(supabase, table) {
  // Most tables here have a NOT NULL `id` primary key, so filtering on that
  // safely matches all rows — Supabase's REST API rejects an unfiltered
  // delete. A few composite-PK tables have no `id` column; DELETE_FILTER_COLUMN
  // names a NOT NULL column to filter on instead.
  const column = DELETE_FILTER_COLUMN[table] || 'id'
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).not(column, 'is', null)
  if (error) throw new Error(`Failed to clean ${table}: ${error.message}`)
  console.log(`  ✓ ${table} (${count ?? 0} rows deleted)`)
}

async function main() {
  const { client: supabase, url } = getSupabase()
  const skipConfirm = process.argv.includes('--yes')

  console.log('\n🧨  Arshanemi — Full Database Reset\n')
  console.log(`Target project: ${url}`)
  console.log(`Tables to wipe: ${TABLES_IN_DELETE_ORDER.join(', ')}\n`)

  if (!skipConfirm) {
    const answer = await confirm('This permanently deletes ALL rows in ALL tables above. Type "DELETE" to continue: ')
    if (answer !== 'DELETE') {
      console.log('Aborted — no changes made.')
      process.exit(0)
    }
  }

  for (const table of TABLES_IN_DELETE_ORDER) {
    await wipeTable(supabase, table)
  }

  console.log('\n✅  Database is empty. Run `npm run seed` to repopulate defaults.\n')
}

main().catch((err) => {
  console.error('\n❌  Clean failed:', err)
  process.exit(1)
})
