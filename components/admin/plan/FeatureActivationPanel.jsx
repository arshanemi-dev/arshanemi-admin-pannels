'use client'
import { useState } from 'react'
import { useToast } from '@/components/admin/Toast'

function FeatureToggle({ on, busy, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? 'bg-[#4a5fd9]' : 'bg-divider'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  )
}

// "Feature Activations" — the ONLY place a recurring coin-based feature
// (feature.fixFeeCoins > 0) gets turned on/off. The satellite tool apps
// never activate/deactivate anything themselves — they just fire
// POST /api/wallet/deduct and show whatever error comes back
// (e.g. 'activation_required'); this panel, here in the admin panel, is
// where that gets fixed. Renders nothing if the viewer has no
// fixFeeCoins-priced features on any granted tool.
export default function FeatureActivationPanel({ tools, onChanged }) {
  const [togglingId, setTogglingId] = useState(null)
  const { addToast } = useToast()

  const rows = (tools || []).flatMap((tool) =>
    (tool.features || [])
      .filter((f) => f.fixFeeCoins > 0)
      .map((f) => ({ ...f, toolSlug: tool.slug, toolTitle: tool.title }))
  )

  if (rows.length === 0) return null

  async function handleToggle(row) {
    const key = `${row.toolSlug}::${row.apiIdentifier}`
    setTogglingId(key)
    try {
      if (row.activationActive) {
        const res = await fetch('/api/wallet/feature/deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolSlug: row.toolSlug, featureApiIdentifier: row.apiIdentifier }),
        })
        if (!res.ok) throw new Error('Could not deactivate')
        addToast('Deactivated')
      } else {
        const res = await fetch('/api/wallet/feature/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolSlug: row.toolSlug, featureApiIdentifier: row.apiIdentifier, idempotencyKey: crypto.randomUUID() }),
        })
        const result = await res.json()
        if (!res.ok) {
          if (result.error === 'insufficient_coins' || result.error === 'coins_expired') {
            addToast('Not enough coins — add coins above first', 'error')
            return
          }
          throw new Error(result.error || 'Could not activate')
        }
        addToast('Activated!')
      }
      onChanged?.()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="inline-block text-2xl md:text-3xl font-bold text-foreground pb-2 border-b-4 border-foreground">
          Feature Activations
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-divider rounded-2xl border border-divider overflow-hidden">
        {rows.map((row) => {
          const key = `${row.toolSlug}::${row.apiIdentifier}`
          return (
            <div key={key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {row.title} <span className="text-xs font-normal text-subtle">— {row.toolTitle}</span>
                </p>
                <p className="text-xs text-subtle mt-0.5">
                  {row.fixFeeCoins} coins/mo
                  {row.activationActive && row.nextRenewalAt
                    ? ` · renews ${new Date(row.nextRenewalAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                    : ''}
                </p>
              </div>
              <FeatureToggle
                on={!!row.activationActive}
                busy={togglingId === key}
                onChange={() => handleToggle(row)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
