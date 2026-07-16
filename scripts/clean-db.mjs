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
// block a parent delete — see scripts/schema.sql + wallet_system_migration.sql
// for the actual constraints this order respects.
const TABLES_IN_DELETE_ORDER = [
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

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer) }))
}

async function wipeTable(supabase, table) {
  // Every table here has a NOT NULL `id` primary key, so this filter safely
  // matches all rows — Supabase's REST API rejects an unfiltered delete.
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).not('id', 'is', null)
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
