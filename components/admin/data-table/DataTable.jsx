'use client'
import { useMemo, useState } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react'
import { exportRowsToExcel, exportRowsToPDF } from './exportUtils'

function toComparableDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// Common admin table — pagination, search, generic + date/time range filters,
// rows-per-page control, and Excel/PDF export of the current filtered set.
// `columns`/`data`/`pageSize`/`searchKeys`/`actions`/`emptyText` are the
// original DataTable props and stay 100% backward compatible; everything
// else is additive and opt-in.
export default function DataTable({
  columns,
  data,
  pageSize = 15,
  pageSizeOptions = [10, 25, 50, 100],
  searchKeys = [],
  filters = [],
  dateKey,
  dateMode = 'date',
  actions,
  title,
  exportFileName,
  enableExport = true,
  emptyText = 'No items found.',
}) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState(() => Object.fromEntries(filters.map((f) => [f.key, 'all'])))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)

  function setFilter(key, value) {
    setActiveFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  function clearDates() {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    let rows = data

    if (query.trim() && searchKeys.length) {
      const q = query.toLowerCase()
      rows = rows.filter((row) => searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)))
    }

    for (const f of filters) {
      const value = activeFilters[f.key]
      if (value && value !== 'all') rows = rows.filter((row) => String(row[f.key]) === String(value))
    }

    if (dateKey && (dateFrom || dateTo)) {
      const from = toComparableDate(dateFrom)
      const to = toComparableDate(dateTo)
      rows = rows.filter((row) => {
        const value = toComparableDate(row[dateKey])
        if (!value) return false
        if (from && value < from) return false
        if (to && value > to) return false
        return true
      })
    }

    return rows
  }, [data, query, searchKeys, filters, activeFilters, dateKey, dateFrom, dateTo])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const va = String(a[sortKey] ?? '')
      const vb = String(b[sortKey] ?? '')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const exportColumns = useMemo(() => columns.filter((c) => c.exportable !== false), [columns])
  const baseFileName = exportFileName || (title ? title.toLowerCase().replace(/\s+/g, '-') : 'export')

  return (
    <div className="flex flex-col gap-4">
      {title && <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-divider-light text-sm text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-subtle whitespace-nowrap">Rows</label>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="px-2.5 py-2 rounded-lg border border-divider-light bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {enableExport && (
              <>
                <button
                  type="button"
                  onClick={() => exportRowsToExcel(sorted, exportColumns, baseFileName)}
                  title={`Export ${sorted.length} row(s) to Excel`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-divider-light text-sm text-muted hover:bg-surface hover:text-accent transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportRowsToPDF(sorted, exportColumns, baseFileName, title)}
                  title={`Export ${sorted.length} row(s) to PDF`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-divider-light text-sm text-muted hover:bg-surface hover:text-accent transition-colors"
                >
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </>
            )}
          </div>
        </div>

        {(filters.length > 0 || dateKey) && (
          <div className="flex flex-wrap items-center gap-3">
            {filters.map((f) => (
              <select
                key={f.key}
                value={activeFilters[f.key] ?? 'all'}
                onChange={(e) => setFilter(f.key, e.target.value)}
                className="px-3 py-2 rounded-lg border border-divider-light bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">{f.label}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}

            {dateKey && (
              <>
                <input
                  type={dateMode === 'datetime' ? 'datetime-local' : 'date'}
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  aria-label="From date"
                  className="px-3 py-2 rounded-lg border border-divider-light bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <span className="text-xs text-subtle">to</span>
                <input
                  type={dateMode === 'datetime' ? 'datetime-local' : 'date'}
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  aria-label="To date"
                  className="px-3 py-2 rounded-lg border border-divider-light bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {(dateFrom || dateTo) && (
                  <button type="button" onClick={clearDates} className="text-xs text-subtle hover:text-accent underline">
                    Clear dates
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-divider bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-divider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-subtle uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-muted' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col opacity-40">
                        <ChevronUp className={`w-3 h-3 -mb-1 ${sortKey === col.key && sortDir === 'asc' ? 'opacity-100' : ''}`} />
                        <ChevronDown className={`w-3 h-3 ${sortKey === col.key && sortDir === 'desc' ? 'opacity-100' : ''}`} />
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-subtle uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-10 text-center text-subtle text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              paged.map((row, ri) => (
                <tr key={row.id || ri} className="hover:bg-surface transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-muted whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-subtle">
        <span>
          {sorted.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sorted.length)} of{' '}
          {sorted.length} items
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
