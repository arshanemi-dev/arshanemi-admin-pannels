import { getAllCoinPackages } from '@/lib/db'
import { getAllTools, buildUsageRateGroups } from '@/lib/tools'
import { ToastProvider } from '@/components/admin/Toast'
import { CoinsUsageTable } from '@/components/admin/plan'
import { PromoBadge } from '@/components/admin/promo'
import SectionHeading from '@/components/ui/SectionHeading'
import { coinPlansNote } from '@/data/coinPlans'
import PlanInteractive from './PlanInteractive'

export const metadata = {
  title: 'Pricing',
  description: 'Buy coins and see per-tool coin pricing for every Arshanemi tool.',
}

// Public pricing page — viewable signed-out (shows the full priced catalog),
// unlike /settings/plan which scopes "Coins Usage Rates" to the viewer's own
// granted tools. Server-fetched directly (no /api/wallet/packages round
// trip), so pricing is visible before signup. "Add Coins" itself still needs
// login — see CoinPlansTable's isLoggedIn() check, which sends a signed-out
// visitor to /signup instead of attempting checkout.
export default async function PublicPlanPage() {
  let packages = []
  let tools = []
  try {
    ;[packages, tools] = await Promise.all([
      getAllCoinPackages({ activeOnly: true }),
      getAllTools(),
    ])
  } catch {
    // Supabase unreachable — render with whatever we have (empty state is
    // handled by CoinPlansTable/CoinsUsageTable themselves).
  }

  return (
    <div className="min-h-screen bg-background pt-[120px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Simple, Coin-Based <span className="gradient-text">Pricing</span></>}
          subtitle="Buy coins once, spend them across every Arshanemi tool. No subscriptions, no lock-in contracts."
        />

        <ToastProvider>
          <PromoBadge />
          <PlanInteractive initialPackages={packages} coinPlansNote={coinPlansNote} />
          <CoinsUsageTable data={buildUsageRateGroups(tools)} />
        </ToastProvider>
      </div>
    </div>
  )
}
