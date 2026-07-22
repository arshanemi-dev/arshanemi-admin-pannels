import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getToolFeature, getUserToolsAccess } from '@/lib/tools'
import { deductWalletCoins, getFeatureActivations } from '@/lib/db'

// The contract external tool apps (PDF Cropper, BG Remover, etc. — separate
// subdomains) integrate against. They authenticate with the same Bearer JWT
// the user already holds.
//
// This is the ONLY enforcement point the tool apps talk to — access grant,
// recurring Activation (feature.fixFeeCoins), and coin-cost are all decided
// here. Tool apps never activate/deactivate, never decide a coin amount,
// never pre-check anything — they fire this one call with a
// {toolSlug, featureApiIdentifier, quantity} and display whatever `error`
// comes back. Activating/deactivating a recurring feature happens only from
// the admin panel's own /settings/plan (FeatureActivationPanel) — see
// app/api/wallet/feature/{activate,deactivate}/route.js.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { toolSlug, featureApiIdentifier, idempotencyKey, quantity } = await req.json()
  if (!toolSlug || !featureApiIdentifier) {
    return NextResponse.json({ error: 'toolSlug and featureApiIdentifier are required' }, { status: 400 })
  }
  const qty = quantity == null ? 1 : Number(quantity)
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
  }

  // Access grant — has this user even been given this tool? The tool app
  // never decides this itself.
  const access = await getUserToolsAccess(payload.userId, payload.role)
  if (!access.includes(toolSlug)) {
    return NextResponse.json({ error: 'access_denied' }, { status: 403 })
  }

  const { tool, feature } = await getToolFeature(toolSlug, featureApiIdentifier)
  if (!tool || !feature || !feature.isActive) {
    return NextResponse.json({ error: 'feature_unavailable' }, { status: 404 })
  }

  if (feature.fixFeeCoins > 0) {
    const activations = await getFeatureActivations(payload.userId, [toolSlug])
    const active = activations.get(`${toolSlug}::${featureApiIdentifier}`)?.isActive
    if (!active) return NextResponse.json({ error: 'activation_required', fixFeeCoins: feature.fixFeeCoins }, { status: 402 })
  }

  const amount = feature.coinCost * qty
  if (amount <= 0) {
    // Free feature — nothing to deduct, no usage-history row needed. The
    // tool app fired this call unconditionally; it never pre-checked coinCost.
    return NextResponse.json({ ok: true, coinsCost: 0, remainingCoins: null, duplicate: false })
  }

  try {
    const result = await deductWalletCoins({
      userId: payload.userId,
      amount,
      toolId: tool.id,
      toolSlug,
      featureId: feature.id ?? null,
      featureApiIdentifier,
      featureTitle: feature.title ?? null,
      idempotencyKey: idempotencyKey ?? null,
      quantity: qty,
    })

    if (!result.ok) {
      if (result.error === 'insufficient_coins') {
        return NextResponse.json(
          { error: 'insufficient_coins', remainingCoins: result.remaining, requiredCoins: amount },
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
    console.error('Wallet deduct error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
