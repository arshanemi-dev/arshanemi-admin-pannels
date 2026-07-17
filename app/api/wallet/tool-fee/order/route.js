import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getToolFeature } from '@/lib/tools'
import { hasUserPaidFeatureFee, createWalletTopup } from '@/lib/db'
import { isConfigured, createOrder } from '@/lib/razorpay'

// Starts a one-time Fix-Fee purchase to unlock a single feature — same shape
// family as /api/wallet/topup/order, but for a feature's flat ₹ price
// instead of a coin package. See plan/tools-pricing-cut-paln.md §3.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isConfigured()) {
    return NextResponse.json({ error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }, { status: 503 })
  }

  const { toolSlug, featureApiIdentifier } = await req.json()
  if (!toolSlug || !featureApiIdentifier) {
    return NextResponse.json({ error: 'toolSlug and featureApiIdentifier are required' }, { status: 400 })
  }

  const { tool, feature } = await getToolFeature(toolSlug, featureApiIdentifier)
  if (!tool || !feature) return NextResponse.json({ error: 'Tool or feature not found' }, { status: 404 })
  if (!(feature.fixFeePaise > 0)) {
    return NextResponse.json({ error: 'no_fee_configured' }, { status: 400 })
  }

  const alreadyPaid = await hasUserPaidFeatureFee(payload.userId, toolSlug, featureApiIdentifier)
  if (alreadyPaid) {
    return NextResponse.json({ ok: true, alreadyPaid: true, toolSlug, featureApiIdentifier })
  }

  try {
    const receipt = `fee_${payload.userId.slice(0, 8)}_${Date.now()}`
    const order = await createOrder({
      amountPaise: feature.fixFeePaise,
      notes: { userId: payload.userId, toolSlug, featureApiIdentifier },
      receipt,
    })

    await createWalletTopup({
      userId: payload.userId,
      coinPackageId: null,
      packageName: feature.title,
      amountPaise: feature.fixFeePaise,
      coinsGranted: 0,
      razorpayOrderId: order.id,
      validityDays: null,
      purchaseType: 'tool_fee',
      toolSlug,
      featureApiIdentifier,
    })

    return NextResponse.json({
      orderId: order.id,
      amountPaise: feature.fixFeePaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      featureTitle: feature.title,
      toolSlug,
      featureApiIdentifier,
    })
  } catch (err) {
    console.error('Create tool-fee order error:', err)
    return NextResponse.json({ error: err.message || 'Could not create order' }, { status: 500 })
  }
}
