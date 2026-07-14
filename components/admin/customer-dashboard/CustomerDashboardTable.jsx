'use client'
import Link from 'next/link'
import DataTable from '@/components/admin/DataTable'

const STATUS_FILTER = {
  key: 'status',
  label: 'All Status',
  options: [
    { value: 'Paid', label: 'Paid' },
    { value: 'Login', label: 'Login' },
    { value: 'Without Login', label: 'Without Login' },
  ],
}

// "Customer Dashboard" table — per-customer status/usage/balance overview,
// built on the shared DataTable (search, status filter, date range on
// first login, export). The "Report" action navigates to that customer's
// own page (app/settings/customer-dashboard/[userId]/page.js) — a real
// route with a back button, not an inline expansion on this page.
export default function CustomerDashboardTable({ data }) {
  const columns = [
    { key: 'userId', label: 'User ID', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'mobile', label: 'Mobile No' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'toolsUse', label: 'Tools Use', sortable: true },
    { key: 'firstLogin', label: 'First Login' },
    { key: 'balance', label: 'Balance', sortable: true },
    {
      key: 'report',
      label: 'Report',
      exportable: false,
      render: (_, row) => (
        <Link
          href={`/settings/customer-dashboard/${row.userId.replace('#', '')}`}
          className="font-bold text-foreground hover:text-accent hover:underline transition-colors"
        >
          Report
        </Link>
      ),
    },
  ]

  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <DataTable
        title="Customer Dashboard"
        columns={columns}
        data={data}
        searchKeys={['userId', 'email', 'mobile', 'toolsUse']}
        filters={[STATUS_FILTER]}
        dateKey="firstLoginDate"
        pageSize={10}
        emptyText="No customers found."
      />
    </div>
  )
}
