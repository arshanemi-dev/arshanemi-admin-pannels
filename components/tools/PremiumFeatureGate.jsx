'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

// Inline "Activate" gate for a tool's recurring coin-based feature
// activation — rendered by app/tools/[slug]/use/page.js in place of the tool
// when lib/toolAccess.js's resolveToolAccess() returns
// kind: 'activation_required'. Coins-only, no Razorpay — activating charges
// feature.fixFeeCoins immediately via /api/wallet/feature/activate and
// starts the monthly renewal cycle (scripts/cron-feature-renewals.mjs). On
// success, a hard reload lands back on this same use-page so the server-side
// gate re-evaluates and renders the real tool.
export default function PremiumFeatureGate({ tool, feature }) {
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState('')

  async function handleActivate() {
    setError('')
    setActivating(true)
    try {
      const res = await fetch('/api/wallet/feature/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: tool.slug, featureApiIdentifier: feature.apiIdentifier, idempotencyKey: crypto.randomUUID() }),
      })
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/tools/${tool.slug}/use`)}`)
        return
      }
      const result = await res.json()
      if (!res.ok) {
        if (result.error === 'insufficient_coins' || result.error === 'coins_expired') {
          router.push(`/plan?tool=${tool.slug}&reason=coins`)
          return
        }
        throw new Error(result.error || 'Could not activate this feature')
      }
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setActivating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-sm mx-auto bg-card border border-divider rounded-2xl p-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
          <Sparkles size={18} />
        </div>
        <h3 className="text-foreground font-bold text-lg mb-1">
          Activate {feature.title}
        </h3>
        <p className="text-muted text-sm mb-1">
          {feature.desc || tool.shortDesc || `Activating unlocks ${feature.title} in ${tool.title}, billed monthly in coins.`}
        </p>
        <p className="text-foreground font-bold text-2xl my-4">{feature.fixFeeCoins} coins<span className="text-sm font-medium text-muted">/mo</span></p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleActivate}
          disabled={activating}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {activating ? <><Loader2 className="animate-spin" size={16} /> Activating…</> : 'Activate'}
        </button>
      </div>
    </div>
  )
}
