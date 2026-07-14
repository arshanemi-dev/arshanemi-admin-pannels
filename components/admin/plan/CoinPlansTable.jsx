'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { usePromoOffer } from '@/components/admin/promo'

// Plan amounts are literal display strings ('₹500', but also 'No sign up' /
// 'Sign Up' for the free rows) — only the ones that actually parse as a
// rupee figure are discountable.
function parseRupeeAmount(amountStr) {
  const match = /^₹(\d+)$/.exec(amountStr ?? '')
  return match ? Number(match[1]) : null
}

// "Plan" table — coin recharge options with single-select checkboxes and
// an "Add Coins" CTA. Selection is local UI state only; wiring the actual
// Razorpay checkout is a separate backend task (see plan/my-payment-management.md).
// When the promo badge (components/admin/promo) is active, discountable
// rows show the original price struck through next to the discounted one.
export default function CoinPlansTable({ data, note }) {
  const [selectedId, setSelectedId] = useState(null)
  const { addToast } = useToast()
  const { offer, active: promoActive } = usePromoOffer()

  const selectedPlan = data.find((plan) => plan.id === selectedId)

  function handleAddCoins() {
    if (!selectedPlan) {
      addToast('Select a plan first', 'error')
      return
    }
    const original = parseRupeeAmount(selectedPlan.amount)
    if (promoActive && original !== null) {
      const discounted = Math.round(original * (1 - offer.discountPercent / 100))
      addToast(`${selectedPlan.amount} plan selected — ₹${discounted} with code ${offer.referralCode} — ${selectedPlan.coin} coins`)
    } else {
      addToast(`${selectedPlan.amount} plan selected — ${selectedPlan.coin} coins`)
    }
  }

  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <div className="flex rounded-2xl border border-divider overflow-hidden">
        <div className="w-1.5 bg-[#4a5fd9] shrink-0" aria-hidden="true" />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#4a5fd9] to-[#f0763f]">
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4 w-2/5">Amount</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Coin</th>
                <th className="text-left text-white font-semibold text-sm md:text-base px-5 py-4">Experience</th>
              </tr>
            </thead>
            <tbody>
              {data.map((plan) => {
                const checked = selectedId === plan.id
                const original = parseRupeeAmount(plan.amount)
                const showDiscount = promoActive && original !== null
                const discounted = showDiscount ? Math.round(original * (1 - offer.discountPercent / 100)) : null
                return (
                  <tr key={plan.id} className="border-t border-divider">
                    <td className="px-5 py-3.5">
                      <label
                        className={`flex items-center gap-3 ${
                          plan.selectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!plan.selectable}
                          onClick={() => setSelectedId(plan.id)}
                          aria-pressed={checked}
                          aria-label={`Select ${plan.amount} plan`}
                          className={`w-5 h-5 shrink-0 rounded-[4px] border-2 flex items-center justify-center transition-colors ${
                            checked ? 'bg-[#f0763f] border-[#f0763f]' : 'border-[#f0763f] bg-transparent'
                          } disabled:border-subtle`}
                        >
                          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </button>
                        {showDiscount ? (
                          <span className="flex items-center gap-2">
                            <span className="text-sm text-subtle line-through">{plan.amount}</span>
                            <span className="text-sm font-semibold text-[#f43f5e]">₹{discounted}</span>
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">{plan.amount}</span>
                        )}
                      </label>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted">{plan.coin}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{plan.experience}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5">
        <p className="text-xs text-subtle max-w-md">{note}</p>
        <button
          type="button"
          onClick={handleAddCoins}
          className="shrink-0 px-8 py-3 rounded-xl bg-gradient-to-r from-[#4a5fd9] to-[#f0763f] text-white text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
        >
          ADD COINS
        </button>
      </div>
    </div>
  )
}
