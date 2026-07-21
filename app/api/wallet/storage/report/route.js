import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { reportStorageUsage } from '@/lib/db'

const PROVIDERS = ['dropbox', 'bunny']

// Called by Link Generator (tools-1) right after an upload or delete
// completes, with the byte delta of what just changed (positive on upload,
// negative on delete) — never an absolute total. This is accounting only,
// not a billing gate: the actual monthly coin charge is computed and applied
// separately by scripts/cron-storage-billing.mjs off the running total this
// endpoint maintains. See plan §C/§E.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, deltaBytes, idempotencyKey } = await req.json()
  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'provider must be one of: ' + PROVIDERS.join(', ') }, { status: 400 })
  }
  if (!Number.isFinite(deltaBytes)) {
    return NextResponse.json({ error: 'deltaBytes must be a number' }, { status: 400 })
  }

  try {
    const result = await reportStorageUsage({
      userId: payload.userId,
      provider,
      deltaBytes: Math.round(deltaBytes),
      idempotencyKey: idempotencyKey ?? null,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('Storage usage report error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
