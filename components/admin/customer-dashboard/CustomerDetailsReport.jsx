import { REPORT_RANGES } from '@/data/coinUsageTrend'
import ReportRow from './ReportRow'

const INFO_FIELDS = [
  ['User ID', 'userId'],
  ['User name', 'userName'],
  ['Mobile No', 'mobile'],
  ['Email', 'email'],
  ['First Login', 'firstLogin'],
  ['Last Login', 'lastLogin'],
  ['Balance', 'balance'],
  ['Exp', 'exp'],
]

// The Report — now this IS the report. Rendered on its own page
// (app/settings/customer-dashboard/[userId]/page.js), reached via the
// "Report" link on a Customer Dashboard row (previously there was also a
// separate, generic multi-user ReportTable; it's gone, superseded by this
// per-customer view). Header info card + five independently-filterable
// coin-usage rows (All Time / Today / 7 Days / Last 30 Days / a custom
// range), each with its own curve chart.
export default function CustomerDetailsReport({ customer }) {
  return (
    <div className="bg-card border border-divider rounded-3xl shadow-sm p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">Report</h2>

      <div className="rounded-2xl border border-divider overflow-hidden">
        <div className="bg-surface flex flex-wrap gap-x-8 gap-y-3 px-5 py-4">
          {INFO_FIELDS.map(([label, key]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">{label}:</span>
              <span className="text-sm text-muted">{customer[key]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1fr)_80px_minmax(220px,2fr)] gap-4 px-5 py-3 border-t border-divider bg-surface">
          <span className="text-sm font-bold text-foreground">Date</span>
          <span className="text-sm font-bold text-foreground">Tools Wise</span>
          <span className="text-sm font-bold text-foreground">Coins</span>
          <span className="text-sm font-bold text-foreground">Chart</span>
        </div>

        {REPORT_RANGES.map((range) => (
          <ReportRow key={range.id} userId={customer.userId} range={range} />
        ))}
        <ReportRow userId={customer.userId} isCustom />
      </div>
    </div>
  )
}
