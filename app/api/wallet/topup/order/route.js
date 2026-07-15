import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getCoinPackageById, createWalletTopup } from '@/lib/db'
import { isConfigured, createOrder } from '@/lib/razorpay'

// Starts a coin purchase: creates a wallet_topups row (status 'created') plus
// a matching Razorpay order, and hands the browser what it needs to open
// Razorpay Checkout.js. Payment isn't confirmed yet — see /topup/verify.
export async function POST(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isConfigured()) {
    return NextResponse.json({ error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }, { status: 503 })
  }

  const { coinPackageId } = await req.json()
  if (!coinPackageId) return NextResponse.json({ error: 'coinPackageId is required' }, { status: 400 })

  const pkg = await getCoinPackageById(coinPackageId)
  if (!pkg || !pkg.isActive) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  try {
    const receipt = `topup_${payload.userId}_${Date.now()}`
    const order = await createOrder({
      amountPaise: pkg.pricePaise,
      notes: { userId: payload.userId, coinPackageId: pkg.id },
      receipt,
    })

    const topup = await createWalletTopup({
      userId: payload.userId,
      coinPackageId: pkg.id,
      packageName: pkg.name,
      amountPaise: pkg.pricePaise,
      coinsGranted: pkg.coins,
      razorpayOrderId: order.id,
    })

    return NextResponse.json({
      orderId: order.id,
      amountPaise: pkg.pricePaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      packageName: pkg.name,
      coins: pkg.coins,
      topupId: topup.id,
    })
  } catch (err) {
    console.error('Create topup order error:', err)
    return NextResponse.json({ error: err.message || 'Could not create order' }, { status: 500 })
  }
}
