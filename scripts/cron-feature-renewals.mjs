/**
 * cron-feature-renewals.mjs — monthly recurring feature-activation billing
 * Run with: npm run cron:feature-renewals
 *
 * A user can activate a "fixFeeCoins" feature (see
 * scripts/feature_activation_migration.sql) — coins are charged immediately
 * on activation, then re-charged every month by this script. Unlike
 * cron-storage-billing.mjs, renewals here NEVER go into debt: insufficient
 * coins at renewal time deactivates the feature instead of charging negative
 * balance — this is a subscription that lapses when unpaid, not a hard bill.
 *
 * Same self-contained direct-Supabase pattern as the other cron scripts (a
 * standalone Node script can't resolve the app's `@/` path alias).
 *
 * MUST run as its own persistent process (PM2, systemd, Docker, a small VPS,
 * a Railway/Render worker service, ...) — it will NOT work if deployed to
 * Vercel itself: Vercel's serverless functions don't stay alive between
 * requests, so a node-cron schedule registered there would silently stop
 * firing, the same problem a raw setInterval has in that environment.
 */

import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key)
}

async function getDueActivations(supabase) {
  const { data, error } = await supabase
    .from('feature_activations')
    .select('*')
    .eq('is_active', true)
    .lte('next_renewal_at', new Date().toISOString())
    .limit(500)
  if (error) throw error
  return data ?? []
}

// Rate is admin-editable via the existing Tools Catalog UI (same fixFeeCoins
// field the activation charge itself uses) — read live, never hardcoded.
async function getCurrentFixFeeCoins(supabase, toolSlug, featureApiIdentifier) {
  const { data, error } = await supabase.from('tools').select('id, content').eq('slug', toolSlug).maybeSingle()
  if (error || !data) return { toolId: null, coins: null }
  const feature = (data.content?.features ?? []).find((f) => f.apiIdentifier === featureApiIdentifier)
  return { toolId: data.id, coins: feature?.fixFeeCoins > 0 ? feature.fixFeeCoins : null }
}

async function advanceRenewal(supabase, row) {
  const next = new Date(row.next_renewal_at)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const { error } = await supabase
    .from('feature_activations')
    .update({ next_renewal_at: next.toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', row.user_id)
    .eq('tool_slug', row.tool_slug)
    .eq('feature_api_identifier', row.feature_api_identifier)
  if (error) throw error
}

async function deactivate(supabase, row, reason) {
  const { error } = await supabase.rpc('deactivate_feature', {
    p_user_id: row.user_id, p_tool_slug: row.tool_slug, p_feature_api_identifier: row.feature_api_identifier,
  })
  if (error) {
    console.error(`[cron] Could not deactivate ${row.tool_slug}/${row.feature_api_identifier} for user ${row.user_id}:`, error.message)
    return
  }
  console.log(`[cron] Deactivated ${row.tool_slug}/${row.feature_api_identifier} for user ${row.user_id} — ${reason}`)
}

async function processRow(supabase, row) {
  const { toolId, coins } = await getCurrentFixFeeCoins(supabase, row.tool_slug, row.feature_api_identifier)

  // Admin removed the price or deactivated the feature since this row was
  // created — nothing left to renew, deactivate rather than loop forever.
  if (!coins) {
    await deactivate(supabase, row, 'no active fixFeeCoins price found')
    return
  }

  // Rolling per-row idempotency key — a same-day re-run of this script (e.g.
  // a PM2 restart) hits deduct_wallet_coins' own UNIQUE(user_id,
  // idempotency_key) short-circuit and returns the prior result instead of
  // double-charging.
  const idempotencyKey = `activation:${row.user_id}:${row.tool_slug}:${row.feature_api_identifier}:${row.next_renewal_at.slice(0, 10)}`
  const { data, error } = await supabase.rpc('deduct_wallet_coins', {
    p_user_id: row.user_id,
    p_amount: coins,
    p_tool_id: toolId,
    p_tool_slug: row.tool_slug,
    p_feature_id: null,
    p_feature_api_identifier: row.feature_api_identifier,
    p_feature_title: null,
    p_idempotency_key: idempotencyKey,
    // p_allow_negative omitted — defaults to false. Renewals never go into
    // debt; insufficient balance deactivates instead (below).
  })

  if (error) {
    console.error(`[cron] RPC error renewing ${row.tool_slug}/${row.feature_api_identifier} for user ${row.user_id}:`, error.message)
    return // leave next_renewal_at as-is — retry tomorrow
  }

  if (data?.ok) {
    console.log(
      `[cron] ${data.duplicate ? '(duplicate, no-op) ' : ''}Renewed ${coins} coins — ` +
      `user ${row.user_id}, ${row.tool_slug}/${row.feature_api_identifier}`
    )
    await advanceRenewal(supabase, row)
    return
  }

  // insufficient_coins / coins_expired / user_not_found — the "if no coins
  // then deactivate" requirement.
  await deactivate(supabase, row, data?.error ?? 'renewal failed')
}

async function runFeatureRenewals() {
  console.log(`[cron] Running feature-activation renewals at ${new Date().toISOString()}`)
  const supabase = getSupabase()

  let due
  try {
    due = await getDueActivations(supabase)
  } catch (err) {
    console.error('[cron] Could not fetch due activations:', err.message)
    return
  }

  if (due.length === 0) {
    console.log('[cron] No renewals due')
    return
  }

  for (const row of due) {
    try {
      await processRow(supabase, row)
    } catch (err) {
      console.error(`[cron] Error processing activation for user ${row.user_id} (${row.tool_slug}/${row.feature_api_identifier}):`, err.message)
    }
  }
}

// Once daily at 03:30 (offset from cron-storage-billing.mjs's 03:00 so they
// don't contend for the same connection pool slot at the exact same instant)
cron.schedule('30 3 * * *', runFeatureRenewals)

console.log('[cron] Feature-activation renewal job started — runs daily at 03:30')
console.log('[cron] Press Ctrl+C to stop.')

// Run once immediately on startup so you can test without waiting for 03:30
runFeatureRenewals()
