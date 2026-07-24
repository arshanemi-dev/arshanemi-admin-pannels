'use client'
import { useEffect, useState } from 'react'
import { CoinPlansTable, FeatureActivationPanel } from '@/components/admin/plan'
import { isLoggedIn } from '@/lib/tokenStore'

// Wraps the two pieces of the public pricing page that need to reflect
// real, per-user state after an action — CoinPlansTable's coin purchase and
// FeatureActivationPanel's activate/deactivate toggles — which a
// server-rendered page fetched once can't do (see app/plan/page.js's own
// comment on why it's SSR in the first place). Mirrors /settings/plan's
// load()-on-mount + refetch-on-change pattern, scoped to just these two
// pieces — CoinsUsageTable stays the server-rendered public catalog, same
// for every visitor whether logged in or not.
//
// FeatureActivationPanel needs per-user activation state (activationActive/
// nextRenewalAt), which only /api/tools/my's enrichment provides — the
// SSR'd `tools` prop from getAllTools() on the page itself has neither, so
// it can't be reused here. Signed-out visitors never see this panel at all;
// they have no activations to show and the API would 401 anyway.
export default function PlanInteractive({ initialPackages, coinPlansNote }) {
  const [packages, setPackages] = useState(initialPackages)
  const [myTools, setMyTools] = useState(null)
  const loggedIn = isLoggedIn()

  async function loadMyTools() {
    try {
      const res = await fetch('/api/tools/my')
      if (res.ok) setMyTools(await res.json())
    } catch {
      // Leave whatever was showing — FeatureActivationPanel just stays hidden/stale.
    }
  }

  async function refreshPackages() {
    try {
      const res = await fetch('/api/wallet/packages')
      if (res.ok) setPackages(await res.json())
    } catch {
      // Purchase itself already succeeded (CoinPlansTable's own toast covers
      // that) — a failed refresh just leaves the prior packages showing.
    }
  }

  useEffect(() => {
    if (loggedIn) loadMyTools()
  }, [loggedIn])

  return (
    <>
      <CoinPlansTable
        packages={packages}
        note={coinPlansNote}
        onPurchased={() => { refreshPackages(); loadMyTools() }}
      />
      {loggedIn && myTools && (
        <FeatureActivationPanel tools={myTools} onChanged={loadMyTools} />
      )}
    </>
  )
}
