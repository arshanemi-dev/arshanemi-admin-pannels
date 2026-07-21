/**
 * cron-storage-billing.mjs — monthly metered storage billing (Link Generator)
 * Run with: npm run cron:storage-billing
 *
 * Link Generator (tools-1) reports storage deltas as they happen (POST
 * /api/wallet/storage/report on every upload/delete), maintained as a running
 * total in user_storage_usage via the report_storage_usage() RPC. This script
 * is the OTHER half: once daily, it finds every (user, provider) row whose
 * next_bill_at has come due, charges coins for storage over the free
 * allowance, and rolls next_bill_at forward by 1 month — independent of any
 * user action, on a rolling per-row cycle (not calendar-month-aligned).
 *
 * Same self-contained direct-Supabase pattern as scripts/cron-cleanup.mjs and
 * scripts/cron-reconcile-topups.mjs (a standalone Node script can't resolve
 * the app's `@/` path alias, so this doesn't import lib/db.js).
 *
 * MUST run as its own persistent process (PM2, systemd, Docker, a small VPS,
 * a Railway/Render worker service, ...) — it will NOT work if deployed to
 * Vercel itself: Vercel's serverless functions don't stay alive between
 * requests, so a node-cron schedule registered there would silently stop
 * firing, the same problem a raw setInterval has in that environment.
 */

import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

const GB = 1024 ** 3
// No schema field for a per-feature "free allowance" — adding one to the
// generic Tools Catalog editor for this single feature would be
// over-engineering, so it's a script constant instead (env-overridable).
const STORAGE_FREE_GB = Number(process.env.STORAGE_FREE_GB ?? 1)
const DEFAULT_COINS_PER_GB = 50
const TOOL_SLUG = 'link-generator'
const FEATURE_API_IDENTIFIER = 'link-storage-gb-month'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key)
}

// Per-GB rate is admin-editable via the existing Tools Catalog UI (same
// coinCost field every other feature uses) rather than hardcoded here — this
// feature is never called via runBillingGate, it exists purely so this rate
// is admin-controlled and shows on the public pricing page.
async function getStorageTool(supabase) {
  const { data, error } = await supabase.from('tools').select('id, content').eq('slug', TOOL_SLUG).maybeSingle()
  if (error || !data) return { toolId: null, ratePerGB: DEFAULT_COINS_PER_GB }
  const feature = (data.content?.features ?? []).find((f) => f.apiIdentifier === FEATURE_API_IDENTIFIER)
  return { toolId: data.id, ratePerGB: feature?.coinCost > 0 ? feature.coinCost : DEFAULT_COINS_PER_GB }
}

async function getDueRows(supabase) {
  const { data, error } = await supabase
    .from('user_storage_usage')
    .select('*')
    .lte('next_bill_at', new Date().toISOString())
    .limit(500)
  if (error) throw error
  return data ?? []
}

async function advanceNextBillAt(supabase, row) {
  const next = new Date(row.next_bill_at)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const { error } = await supabase
    .from('user_storage_usage')
    .update({ next_bill_at: next.toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', row.user_id)
    .eq('provider', row.provider)
  if (error) throw error
}

async function billRow(supabase, row, { toolId, ratePerGB }) {
  const billableGB = Math.max(0, Math.ceil(row.storage_bytes / GB - STORAGE_FREE_GB))
  const coins = billableGB * ratePerGB

  if (coins > 0) {
    // Rolling per-row idempotency key — a same-day re-run of this script
    // (e.g. a PM2 restart) hits the RPC's own UNIQUE(user_id, idempotency_key)
    // short-circuit and returns the prior result instead of double-charging.
    const idempotencyKey = `storage:${row.user_id}:${row.provider}:${row.next_bill_at.slice(0, 10)}`
    const { data, error } = await supabase.rpc('deduct_wallet_coins', {
      p_user_id: row.user_id,
      p_amount: coins,
      p_tool_id: toolId,
      p_tool_slug: TOOL_SLUG,
      p_feature_id: null,
      p_feature_api_identifier: FEATURE_API_IDENTIFIER,
      p_feature_title: 'Storage (GB/month)',
      p_idempotency_key: idempotencyKey,
      p_allow_negative: true,
      p_quantity: billableGB,
    })
    if (error) {
      console.error(`[cron] RPC error billing storage for user ${row.user_id} (${row.provider}):`, error.message)
      return // leave next_bill_at as-is — retry tomorrow
    }
    if (!data?.ok) {
      console.error(`[cron] deduct_wallet_coins rejected storage bill for user ${row.user_id} (${row.provider}):`, data?.error)
      return // e.g. user_not_found — retry tomorrow rather than silently advancing past it
    }
    console.log(
      `[cron] ${data.duplicate ? '(duplicate, no-op) ' : ''}Billed ${coins} coins ` +
      `(${billableGB}GB over ${STORAGE_FREE_GB}GB free) — user ${row.user_id}, ${row.provider}`
    )
  } else {
    console.log(`[cron] User ${row.user_id} (${row.provider}) under free allowance — no charge`)
  }

  await advanceNextBillAt(supabase, row)
}

async function runStorageBilling() {
  console.log(`[cron] Running storage billing at ${new Date().toISOString()}`)
  const supabase = getSupabase()

  let due
  try {
    due = await getDueRows(supabase)
  } catch (err) {
    console.error('[cron] Could not fetch due storage rows:', err.message)
    return
  }

  if (due.length === 0) {
    console.log('[cron] No storage bills due')
    return
  }

  const rate = await getStorageTool(supabase)
  for (const row of due) {
    try {
      await billRow(supabase, row, rate)
    } catch (err) {
      console.error(`[cron] Error processing storage row for user ${row.user_id} (${row.provider}):`, err.message)
    }
  }
}

// Once daily at 03:00
cron.schedule('0 3 * * *', runStorageBilling)

console.log('[cron] Storage billing job started — runs daily at 03:00')
console.log('[cron] Press Ctrl+C to stop.')

// Run once immediately on startup so you can test without waiting for 03:00
runStorageBilling()
