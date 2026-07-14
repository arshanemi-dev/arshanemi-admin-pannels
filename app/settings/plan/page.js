import { PageHeader } from '@/components/admin/PageHeader'
import { CoinsUsageTable, CoinPlansTable } from '@/components/admin/plan'
import { coinsUsageRates } from '@/data/coinsUsageRates'
import { coinPlans, coinPlansNote } from '@/data/coinPlans'

export default function PlanPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <PageHeader title="Plan" description="Token pricing per tool and coin recharge plans" />
      <CoinPlansTable data={coinPlans} note={coinPlansNote} />
      <CoinsUsageTable data={coinsUsageRates} />
    </div>
  )
}
