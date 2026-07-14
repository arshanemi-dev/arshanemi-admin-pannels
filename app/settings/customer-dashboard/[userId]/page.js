import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { CustomerDetailsReport } from '@/components/admin/customer-dashboard'
import { customers } from '@/data/customers'

export default async function CustomerReportPage({ params }) {
  const { userId } = await params
  const customer = customers.find((c) => c.userId === `#${userId}`)
  if (!customer) notFound()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${customer.userName}'s Report`}
        description={`${customer.userId} · ${customer.email}`}
        backHref="/settings/customer-dashboard"
      />
      <CustomerDetailsReport customer={customer} />
    </div>
  )
}
