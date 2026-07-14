'use client'
import DataTable from '@/components/admin/DataTable'

// "Report" table — login/balance/expiry history across customers, built on
// the shared DataTable. `id="customer-report"` is the scroll target for
// CustomerDashboardTable's per-row "Report" action.
export default function ReportTable({ data }) {
  const columns = [
    { key: 'userId', label: 'User ID', sortable: true },
    { key: 'userName', label: 'User name', sortable: true, render: (v) => <span className="font-medium text-foreground">{v}</span> },
    { key: 'mobile', label: 'Mobile No' },
    { key: 'email', label: 'Email' },
    { key: 'firstLogin', label: 'First Login Date' },
    { key: 'lastLogin', label: 'Last Login Date' },
    { key: 'balance', label: 'Balance', sortable: true },
    { key: 'exp', label: 'Exp', render: (v) => <span className="font-bold text-foreground">{v}</span> },
  ]

  return (
    <div id="customer-report" className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8 scroll-mt-8">
      <DataTable
        title="Report"
        columns={columns}
        data={data}
        searchKeys={['userId', 'userName', 'mobile', 'email']}
        pageSize={10}
        emptyText="No report rows found."
      />
    </div>
  )
}
