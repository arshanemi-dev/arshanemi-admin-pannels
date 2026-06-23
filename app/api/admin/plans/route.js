import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { dummyPlans } from '@/data/dummySubscription'

// If RAZORPAY_KEY_SECRET is configured, sync plan prices from Razorpay API.
// Otherwise return static dummy plans enriched with env-configured plan IDs.
async function fetchRazorpayPlans() {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return null

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res = await fetch('https://api.razorpay.com/v1/plans?count=100', {
      headers: { Authorization: `Basic ${credentials}` },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.items ?? null
  } catch {
    return null
  }
}

export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const razorpayPlans = await fetchRazorpayPlans()

  // Merge live Razorpay data into our plan definitions when available
  const plans = dummyPlans.map(plan => {
    if (!razorpayPlans || !plan.razorpayPlanId) return plan
    const live = razorpayPlans.find(p => p.id === plan.razorpayPlanId)
    if (!live) return plan
    return {
      ...plan,
      price:    (live.item?.amount ?? plan.price * 100) / 100,
      currency: (live.item?.currency ?? plan.currency).toUpperCase(),
      interval: live.period ?? plan.interval,
    }
  })

  return NextResponse.json(plans)
}
