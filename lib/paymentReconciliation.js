// Resolves wallet_topups stuck in 'created' status by asking Razorpay itself
// what happened, instead of trusting a timer. Two callers use this:
//   - app/api/wallet/reconcile/route.js — scoped to one user, fired once
//     right after login (and optionally polled a few times client-side while
//     a 'pending' row is visible — see components/admin/wallet/UserWalletPanel.jsx).
//   - app/api/cron/reconcile-topups/route.js — platform-wide sweep, meant to
//     be hit periodically by an external scheduler (see vercel.json).
//
// Why not a setInterval in the API route itself: Next.js API routes are
// stateless request handlers — a timer started inside one has no guarantee
// of surviving past that request/instance (especially on serverless hosting,
// where the instance can be frozen or recycled right after the response is
// sent). A periodic external trigger calling a stateless "check what's
// pending right now" endpoint is the reliable version of the same idea.
import { fetchOrderPayments } from '@/lib/razorpay'
import {
  getStalePendingTopups,
  setTopupReconcileAttempts,
  markWalletTopupFailed,
  creditWalletTopup,
} from '@/lib/db'

const MAX_ATTEMPTS = 3
// Gives the client-side verify call (fired the instant Razorpay Checkout
// succeeds) and the webhook a fair head start before anything here treats an
// order as "stuck" — most legitimate payments resolve well inside this window.
const MIN_AGE_SECONDS = 20

export async function reconcilePendingTopups({ userId } = {}) {
  const stale = await getStalePendingTopups({ userId, minAgeSeconds: MIN_AGE_SECONDS, maxAttempts: MAX_ATTEMPTS })
  const results = []

  for (const topup of stale) {
    try {
      const { items } = await fetchOrderPayments(topup.razorpayOrderId)
      const captured = items.find((p) => p.status === 'captured')

      if (captured) {
        // Authoritative — this came from Razorpay's own server API via our
        // secret key, not a client-supplied signature, so no HMAC to check.
        const credited = await creditWalletTopup({
          razorpayOrderId: topup.razorpayOrderId,
          razorpayPaymentId: captured.id,
          razorpaySignature: null,
        })
        results.push({ topupId: topup.id, outcome: 'credited', credited })
        continue
      }

      const nextAttempts = (topup.reconcileAttempts ?? 0) + 1
      if (nextAttempts >= MAX_ATTEMPTS) {
        const failedPayment = items.find((p) => p.status === 'failed')
        const reason = failedPayment?.error_description || 'Payment not completed after 3 reconciliation attempts'
        await markWalletTopupFailed(topup.razorpayOrderId, reason)
        results.push({ topupId: topup.id, outcome: 'failed', reason })
      } else {
        await setTopupReconcileAttempts(topup.id, nextAttempts)
        results.push({ topupId: topup.id, outcome: 'pending', attempts: nextAttempts })
      }
    } catch (err) {
      // Razorpay unreachable, rate-limited, etc. — leave the attempt count
      // untouched so this order gets a fair retry next sweep instead of
      // burning one of its 3 attempts on our own transient failure.
      console.error(`Reconcile topup ${topup.id} error:`, err)
      results.push({ topupId: topup.id, outcome: 'error', error: err.message })
    }
  }

  return results
}
