import { PageHeader } from '@/components/admin/PageHeader'
import { CoinsUsageTable, CoinPlansTable } from '@/components/admin/plan'
import { coinsUsageRates } from '@/data/coinsUsageRates'
import { coinPlans, coinPlansNote } from '@/data/coinPlans'

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Plan" description="Coins pricing per tool and coin recharge plans" />
      <CoinPlansTable data={coinPlans} note={coinPlansNote} />
      <CoinsUsageTable data={coinsUsageRates} />
    </div>
  )
}
