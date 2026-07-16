/**
 * cron-reconcile-topups.mjs — payment reconciliation sweep (Coin-Wallet Billing)
 * Run with: npm run cron:reconcile
 *
 * Finds wallet_topups stuck in 'created' status, checks Razorpay's own Fetch
 * Payments for an Order API directly (authoritative — no HMAC to verify,
 * this is a secret-key-authenticated server call, not client-supplied data),
 * and credits/fails/retries accordingly. Same logic as
 * lib/paymentReconciliation.js (used inside the Next.js app for the
 * post-login check and the client-side polling on the Wallet tab) —
 * duplicated here rather than imported, since a standalone Node script can't
 * resolve the app's `@/` path alias; same self-contained pattern already
 * used by scripts/cron-cleanup.mjs (which also talks to Supabase directly
 * instead of importing lib/db.js).
 *
 * MUST run as its own persistent process (PM2, systemd, Docker, a small VPS,
 * a Railway/Render worker service, ...) — it will NOT work if deployed to
 * Vercel itself: Vercel's serverless functions don't stay alive between
 * requests, so a node-cron schedule registered there would silently stop
 * firing, the same problem a raw setInterval has in that environment.
 */

import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS = 3
// Gives the client-side verify call (fired the instant Razorpay Checkout
// succeeds) and the webhook a fair head start before anything here treats an
// order as "stuck".
const MIN_AGE_SECONDS = 20

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key)
}

function razorpayAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay env vars not set (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)')
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}

async function fetchOrderPayments(orderId) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
    headers: { Authorization: razorpayAuthHeader() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.description ?? `Razorpay error ${res.status}`)
  }
  return res.json()
}

async function getStalePendingTopups(supabase) {
  const cutoff = new Date(Date.now() - MIN_AGE_SECONDS * 1000).toISOString()
  const { data, error } = await supabase
    .from('wallet_topups')
    .select('*')
    .eq('status', 'created')
    .lt('reconcile_attempts', MAX_ATTEMPTS)
    .lte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return data ?? []
}

async function creditTopup(supabase, { orderId, paymentId }) {
  const { data, error } = await supabase.rpc('credit_wallet_topup', {
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
    p_razorpay_signature: null,
  })
  if (error) throw error
  return data
}

async function markFailed(supabase, orderId, reason) {
  const { error } = await supabase
    .from('wallet_topups')
    .update({ status: 'failed', failure_reason: reason, updated_at: new Date().toISOString() })
    .eq('razorpay_order_id', orderId)
  if (error) throw error
}

async function setAttempts(supabase, id, attempts) {
  const { error } = await supabase
    .from('wallet_topups')
    .update({ reconcile_attempts: attempts, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

async function runReconciliation() {
  console.log(`[cron] Reconciling pending top-ups at ${new Date().toISOString()}`)
  const supabase = getSupabase()

  let stale
  try {
    stale = await getStalePendingTopups(supabase)
  } catch (err) {
    console.error('[cron] Could not fetch stale top-ups:', err.message)
    return
  }

  if (stale.length === 0) {
    console.log('[cron] Nothing pending — all clear')
    return
  }

  for (const topup of stale) {
    try {
      const { items } = await fetchOrderPayments(topup.razorpay_order_id)
      const captured = items.find((p) => p.status === 'captured')

      if (captured) {
        await creditTopup(supabase, { orderId: topup.razorpay_order_id, paymentId: captured.id })
        console.log(`[cron] ✓ Credited topup ${topup.id} (order ${topup.razorpay_order_id})`)
        continue
      }

      const nextAttempts = (topup.reconcile_attempts ?? 0) + 1
      if (nextAttempts >= MAX_ATTEMPTS) {
        const failedPayment = items.find((p) => p.status === 'failed')
        const reason = failedPayment?.error_description || 'Payment not completed after 3 reconciliation attempts'
        await markFailed(supabase, topup.razorpay_order_id, reason)
        console.log(`[cron] ✗ Marked topup ${topup.id} failed: ${reason}`)
      } else {
        await setAttempts(supabase, topup.id, nextAttempts)
        console.log(`[cron] … topup ${topup.id} still pending (attempt ${nextAttempts}/${MAX_ATTEMPTS})`)
      }
    } catch (err) {
      // Razorpay unreachable, rate-limited, etc. — don't burn an attempt on
      // our own transient failure, just log and retry next sweep.
      console.error(`[cron] Error reconciling topup ${topup.id}:`, err.message)
    }
  }
}

// Every 5 minutes
cron.schedule('*/5 * * * *', runReconciliation)

console.log('[cron] Payment reconciliation job started — runs every 5 minutes')
console.log('[cron] Press Ctrl+C to stop.')

// Run once immediately on startup so you can test without waiting 5 minutes
runReconciliation()
