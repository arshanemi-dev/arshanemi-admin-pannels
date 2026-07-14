import { PageHeader } from '@/components/admin/PageHeader'
import { CustomerDashboardTable } from '@/components/admin/customer-dashboard'
import { customers } from '@/data/customers'

export default function CustomerDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Customer Dashboard" description="Customer activity, tool usage, and login reports" />
      <CustomerDashboardTable data={customers} />
    </div>
  )
}
