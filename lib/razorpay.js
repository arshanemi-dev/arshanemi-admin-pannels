// Coin-Wallet billing's Razorpay client. This product is coins-only now — the
// old dummy Subscriptions scaffold (app/api/admin/subscription/*, plans/*,
// data/dummySubscription.js) was removed. Raw-fetch + Basic-auth pattern,
// same shape that scaffold used to have, kept for consistency.

export function isConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

function authHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}

export async function createOrder({ amountPaise, currency = 'INR', notes, receipt }) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency, receipt, notes }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.description ?? `Razorpay error ${res.status}`)
  }
  return res.json()
}

// Authoritative order-status check, straight from Razorpay's own server API
// (Basic-auth with our secret key — not a client-supplied signature, so no
// HMAC verification needed here the way verifyPaymentSignature requires for
// browser-originated data). Used by the reconciliation sweep
// (lib/paymentReconciliation.js) to resolve orders stuck in 'created' status
// without waiting on the webhook or a client-side verify call that may never
// arrive. Returns Razorpay's payment list for the order — empty if the
// customer never completed/attempted the checkout at all.
export async function fetchOrderPayments(orderId) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
    headers: { Authorization: authHeader() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.description ?? `Razorpay error ${res.status}`)
  }
  return res.json()
}

export async function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const crypto = await import('crypto')
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return expected === signature
}

export async function verifyWebhookSignature({ rawBody, signature }) {
  const crypto = await import('crypto')
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}
