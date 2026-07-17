import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getWalletTopupByOrderId, creditWalletTopup } from '@/lib/db'
import { verifyPaymentSignature } from '@/lib/razorpay'

// Called by the browser right after Razorpay Checkout succeeds for a Fix-Fee
// purchase. Structurally identical to /api/wallet/topup/verify — reuses the
// same credit_wallet_topup RPC, which branches on purchase_type (see the
// migration). Idempotent — safe to also be beaten by the webhook or the
// reconciliation sweep.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json()
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
  }

  const topup = await getWalletTopupByOrderId(razorpayOrderId)
  if (!topup) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (topup.userId !== payload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const validSignature = await verifyPaymentSignature({
    orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature,
  })
  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  try {
    const result = await creditWalletTopup({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({
      ...result,
      toolSlug: topup.toolSlug,
      featureApiIdentifier: topup.featureApiIdentifier,
    })
  } catch (err) {
    console.error('Verify tool-fee error:', err)
    return NextResponse.json({ error: err.message || 'Could not verify payment' }, { status: 500 })
  }
}
