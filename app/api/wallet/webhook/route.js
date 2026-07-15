import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { creditWalletTopup, markWalletTopupFailed } from '@/lib/db'

// Razorpay calls this directly — no user auth, HMAC-verified raw body instead.
// Safety net for /api/wallet/topup/verify: if the browser tab closes before
// that call lands, this still credits the coins once Razorpay confirms
// payment. creditWalletTopup() is idempotent, so whichever path runs first wins.
export async function POST(req) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  const valid = await verifyWebhookSignature({ rawBody, signature })
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(rawBody)
  const eventType = event?.event

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event?.payload?.payment?.entity
      const order = event?.payload?.order?.entity
      const orderId = payment?.order_id ?? order?.id
      const paymentId = payment?.id ?? null
      if (orderId) {
        await creditWalletTopup({ razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: null })
      }
    } else if (eventType === 'payment.failed') {
      const payment = event?.payload?.payment?.entity
      if (payment?.order_id) {
        await markWalletTopupFailed(payment.order_id, payment.error_description || 'Payment failed')
      }
    }
  } catch (err) {
    console.error('Wallet webhook processing error:', err)
  }

  return NextResponse.json({ ok: true })
}
