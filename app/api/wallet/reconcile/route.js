import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { reconcilePendingTopups } from '@/lib/paymentReconciliation'

// Checks the current user's own stuck-'created' top-ups against Razorpay and
// resolves them (credit/fail/retry) — see lib/paymentReconciliation.js.
// Called once right after login, and optionally polled a few times
// client-side while a 'pending' row is visible on the Wallet tab.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const results = await reconcilePendingTopups({ userId: payload.userId })
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('Wallet reconcile error:', err)
    return NextResponse.json({ error: 'Could not check pending payments' }, { status: 500 })
  }
}
