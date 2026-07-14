'use client'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { CustomerDashboardTable, ReportTable, CustomerReportDrilldown } from '@/components/admin/customer-dashboard'
import { customers } from '@/data/customers'
import { customerReports } from '@/data/customerReports'

export default function CustomerDashboardPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    if (!selectedCustomer) return
    document.getElementById('customer-report-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedCustomer])

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <PageHeader title="Customer Dashboard" description="Customer activity, tool usage, and login reports" />
      <CustomerDashboardTable data={customers} onSelectCustomer={setSelectedCustomer} />
      <ReportTable data={customerReports} />
      {selectedCustomer && <CustomerReportDrilldown customer={selectedCustomer} />}
    </div>
  )
}
