import { PageHeader } from '@/components/admin/PageHeader'
import { CustomerDashboardTable, ReportTable } from '@/components/admin/customer-dashboard'
import { customers } from '@/data/customers'
import { customerReports } from '@/data/customerReports'

export default function CustomerDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <PageHeader title="Customer Dashboard" description="Customer activity, tool usage, and login reports" />
      <CustomerDashboardTable data={customers} />
      <ReportTable data={customerReports} />
    </div>
  )
}
