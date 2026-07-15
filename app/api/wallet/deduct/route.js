import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getToolFeature } from '@/lib/tools'
import { deductWalletCoins } from '@/lib/db'

// The contract external tool apps (PDF Cropper, BG Remover, etc. — separate
// subdomains) integrate against. They authenticate with the same Bearer JWT
// the user already holds — see plan/my-payment-management.md §7.
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

  try {
    const result = await deductWalletCoins({
      userId: payload.userId,
      amount: feature.coinCost,
      toolId: tool.id,
      toolSlug,
      featureId: feature.id ?? null,
      featureApiIdentifier,
      featureTitle: feature.title ?? null,
      idempotencyKey: idempotencyKey ?? null,
    })

    if (!result.ok) {
      if (result.error === 'insufficient_coins') {
        return NextResponse.json(
          { error: 'insufficient_coins', remainingCoins: result.remaining, requiredCoins: feature.coinCost },
          { status: 402 }
        )
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
    console.error('Wallet deduct error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
