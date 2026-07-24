'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Check } from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { usePromoOffer } from '@/components/admin/promo'
import { isLoggedIn } from '@/lib/tokenStore'

function formatValidity(days) {
  if (!days) return '—'
  if (days % 365 === 0) return `${days / 365} Year${days === 365 ? '' : 's'}`
  if (days % 30 === 0) return `${days / 30} Month${days === 30 ? '' : 's'}`
  return `${days} Day${days === 1 ? '' : 's'}`
}

// "Plan" table — real coin_packages (admin-managed at Settings → Coin
// Packages) with single-select checkboxes and an "Add Coins" CTA that opens
// Razorpay Checkout. On success the coins land in the buyer's wallet via
// /api/wallet/topup/verify (see plan/my-payment-management.md §6/§7).
// When the promo badge (components/admin/promo) is active, discountable
// rows show the original price struck through next to the discounted one.
// Rendered both at /settings/plan (always logged in) and the public /plan
// page (may be signed out) — a signed-out click goes to /login instead of
// attempting checkout, per direct instruction.
export default function CoinPlansTable({ packages, note, onPurchased }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const { addToast } = useToast()
  const { offer, active: promoActive } = usePromoOffer()

  const selectedPlan = packages.find((pkg) => pkg.id === selectedId)

  function handleAddCoins() {
    if (!selectedPlan) {
      addToast('Select a plan first', 'error')
      return
    }
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    if (typeof window === 'undefined' || !window.Razorpay) {
      addToast('Payment gateway is still loading — try again in a moment', 'error')
      return
    }

    setPurchasing(true)
    fetch('/api/wallet/topup/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coinPackageId: selectedPlan.id }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          // Stale/expired local session — send them to log back in rather
          // than signup again (they already have an account).
          router.push('/login')
          throw new Error('Please log in again to continue')
        }
        const order = await res.json()
        if (!res.ok) throw new Error(order.error || 'Could not start checkout')

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amountPaise,
          currency: 'INR',
          name: 'Arshanemi',
          description: `${order.packageName} — ${order.coins} coins`,
          order_id: order.orderId,
          theme: { color: '#4a5fd9' },
          modal: { ondismiss: () => setPurchasing(false) },
          // Explicitly surfaces a UPI block (collect/intent/QR flows — QR
          // shows automatically on desktop) alongside cards. Checkout was
          // only showing Cards without this — show_default_blocks stays
          // true so any other method already enabled on the account (wallets,
          // netbanking, etc.) keeps showing too; this only adds UPI on top.
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Pay via UPI',
                  instruments: [{ method: 'upi' }],
                },
              },
              sequence: ['block.upi', 'block.other'],
              preferences: { show_default_blocks: true },
            },
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/wallet/topup/verify', {
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
              addToast(`${order.coins} coins added to your wallet!`)
              onPurchased?.()
            } catch (err) {
              addToast(err.message, 'error')
            } finally {
              setPurchasing(false)
            }
          },
        })
        rzp.on('payment.failed', () => {
          addToast('Payment failed — please try again', 'error')
          setPurchasing(false)
        })
        rzp.open()
      })
      .catch((err) => {
        addToast(err.message, 'error')
        setPurchasing(false)
      })
  }

  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex rounded-2xl border border-divider overflow-hidden">
        <div className="w-1.5 bg-[#4a5fd9] shrink-0" aria-hidden="true" />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#4a5fd9] to-[#f0763f]">
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4 w-2/5">Amount</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Coin</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Expiry</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Badge</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-subtle">No coin packages available right now.</td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const checked = selectedId === pkg.id
                  const rupees = pkg.pricePaise / 100
                  const discounted = promoActive ? Math.round(rupees * (1 - offer.discountPercent / 100)) : null
                  return (
                    <tr key={pkg.id} className="border-t border-divider">
                      <td className="px-5 py-3.5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setSelectedId(pkg.id)}
                            aria-pressed={checked}
                            aria-label={`Select ${pkg.name} plan`}
                            className={`w-5 h-5 shrink-0 rounded-[4px] border-2 flex items-center justify-center transition-colors ${
                              checked ? 'bg-[#f0763f] border-[#f0763f]' : 'border-[#f0763f] bg-transparent'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </button>
                          {discounted !== null ? (
                            <span className="flex items-center gap-2">
                              <span className="text-sm text-subtle line-through">₹{rupees.toLocaleString('en-IN')}</span>
                              <span className="text-sm font-semibold text-[#f43f5e]">₹{discounted.toLocaleString('en-IN')}</span>
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">₹{rupees.toLocaleString('en-IN')}</span>
                          )}
                        </label>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted">{pkg.coins.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-sm text-muted">{formatValidity(pkg.validityDays)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted">{pkg.badge || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5">
        <p className="text-xs text-subtle max-w-md">{note}</p>
        <button
          type="button"
          onClick={handleAddCoins}
          disabled={purchasing}
          className="shrink-0 px-8 py-3 rounded-xl bg-gradient-to-r from-[#4a5fd9] to-[#f0763f] text-white text-sm font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {purchasing ? 'PROCESSING…' : 'ADD COINS'}
        </button>
      </div>
    </div>
  )
}
