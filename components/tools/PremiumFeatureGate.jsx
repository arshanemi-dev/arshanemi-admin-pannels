'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Loader2, Sparkles } from 'lucide-react'

// Inline "Pay Now" gate for a tool's unpaid one-time fix fee — rendered by
// app/tools/[slug]/use/page.js in place of the tool when
// lib/toolAccess.js's resolveToolAccess() returns kind: 'fee_required'.
// Mirrors components/admin/plan/CoinPlansTable.jsx's Razorpay flow, scoped to
// a single feature via /api/wallet/tool-fee/order + /verify. On success, a
// hard reload lands back on this same use-page so the server-side gate
// re-evaluates and renders the real tool.
export default function PremiumFeatureGate({ tool, feature }) {
  const router = useRouter()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  function handlePayNow() {
    setError('')
    if (typeof window === 'undefined' || !window.Razorpay) {
      setError('Payment gateway is still loading — try again in a moment')
      return
    }

    setPaying(true)
    fetch('/api/wallet/tool-fee/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolSlug: tool.slug, featureApiIdentifier: feature.apiIdentifier }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/tools/${tool.slug}/use`)}`)
          return
        }
        const order = await res.json()
        if (!res.ok) throw new Error(order.error || 'Could not start checkout')

        if (order.alreadyPaid) {
          window.location.reload()
          return
        }

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'Arshanemi',
          description: order.featureTitle || feature.title,
          order_id: order.orderId,
          theme: { color: '#4a5fd9' },
          modal: { ondismiss: () => setPaying(false) },
          config: {
            display: {
              blocks: {
                upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
              },
              sequence: ['block.upi', 'block.other'],
              preferences: { show_default_blocks: true },
            },
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/wallet/tool-fee/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              })
              const result = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(result.error || 'Payment verification failed')
              window.location.reload()
            } catch (err) {
              setError(err.message)
              setPaying(false)
            }
          },
        })
        rzp.on('payment.failed', () => {
          setError('Payment failed — please try again')
          setPaying(false)
        })
        rzp.open()
      })
      .catch((err) => {
        setError(err.message)
        setPaying(false)
      })
  }

  const rupees = (feature.fixFeePaise / 100).toLocaleString('en-IN')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="w-full max-w-sm mx-auto bg-card border border-divider rounded-2xl p-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
          <Sparkles size={18} />
        </div>
        <h3 className="text-foreground font-bold text-lg mb-1">
          Unlock {feature.title}
        </h3>
        <p className="text-muted text-sm mb-1">
          {feature.desc || tool.shortDesc || `A one-time purchase unlocks ${feature.title} in ${tool.title}, forever.`}
        </p>
        <p className="text-foreground font-bold text-2xl my-4">₹{rupees}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePayNow}
          disabled={paying}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {paying ? <><Loader2 className="animate-spin" size={16} /> Processing…</> : 'Pay Now'}
        </button>
      </div>
    </div>
  )
}
