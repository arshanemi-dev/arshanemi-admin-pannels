import { NextResponse } from 'next/server'
import { reconcilePendingTopups } from '@/lib/paymentReconciliation'

// Platform-wide sweep of every user's stuck-'created' top-ups — meant to be
// hit periodically by a scheduler (see vercel.json's `crons` entry), not a
// user-facing route. Vercel Cron automatically sends
// `Authorization: Bearer $CRON_SECRET` when that env var is set on the
// project — any other scheduler (cron-job.org, GitHub Actions, etc.) just
// needs to send the same header itself.
export async function GET(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await reconcilePendingTopups()
    return NextResponse.json({ ok: true, checked: results.length, results })
  } catch (err) {
    console.error('Cron reconcile-topups error:', err)
    return NextResponse.json({ error: 'Reconciliation sweep failed' }, { status: 500 })
  }
}
