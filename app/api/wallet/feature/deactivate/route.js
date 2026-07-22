import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { deactivateFeature } from '@/lib/db'

// Turns off a feature's recurring activation — stops future monthly
// renewals. No refund for the current period (standard
// subscription-cancellation semantics).
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toolSlug, featureApiIdentifier } = await req.json()
  if (!toolSlug || !featureApiIdentifier) {
    return NextResponse.json({ error: 'toolSlug and featureApiIdentifier are required' }, { status: 400 })
  }

  try {
    const result = await deactivateFeature({ userId: payload.userId, toolSlug, featureApiIdentifier })
    return NextResponse.json(result)
  } catch (err) {
    console.error('Feature deactivate error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
