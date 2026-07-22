import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getToolFeature } from '@/lib/tools'
import { activateFeature } from '@/lib/db'

// Turns on a feature's recurring coin-based activation — charges
// feature.fixFeeCoins immediately (the first month) and starts the monthly
// renewal cycle (see scripts/cron-feature-renewals.mjs). Same Bearer-JWT
// contract as /api/wallet/deduct. Coins-only, no Razorpay/real money in this
// gate at all.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toolSlug, featureApiIdentifier, idempotencyKey } = await req.json()
  if (!toolSlug || !featureApiIdentifier) {
    return NextResponse.json({ error: 'toolSlug and featureApiIdentifier are required' }, { status: 400 })
  }

  const { tool, feature } = await getToolFeature(toolSlug, featureApiIdentifier)
  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  if (!feature || !feature.isActive) {
    return NextResponse.json({ error: 'Feature not found or not active' }, { status: 404 })
  }
  if (!(feature.fixFeeCoins > 0)) {
    return NextResponse.json({ error: 'no_activation_configured' }, { status: 400 })
  }

  try {
    const result = await activateFeature({
      userId: payload.userId,
      toolId: tool.id,
      toolSlug,
      featureId: feature.id ?? null,
      featureApiIdentifier,
      featureTitle: feature.title ?? null,
      coins: feature.fixFeeCoins,
      idempotencyKey: idempotencyKey ?? null,
    })

    if (!result.ok) {
      // Same error vocabulary as /api/wallet/deduct — no new shapes for
      // client code to special-case.
      if (result.error === 'insufficient_coins') {
        return NextResponse.json(
          { error: 'insufficient_coins', remainingCoins: result.remaining, requiredCoins: feature.fixFeeCoins },
          { status: 402 }
        )
      }
      if (result.error === 'coins_expired') {
        return NextResponse.json({ error: 'coins_expired', expiredAt: result.expiredAt }, { status: 402 })
      }
      if (result.error === 'user_not_found') {
        return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      usageId: result.usageId,
      coinsCost: result.coinsCost,
      remainingCoins: result.remaining,
      duplicate: result.duplicate,
    })
  } catch (err) {
    console.error('Feature activate error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
