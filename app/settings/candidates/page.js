'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Users, Search, Download, Mail, Phone, Briefcase,
  Clock, ChevronLeft, ChevronRight, ExternalLink, Trash2,
  RefreshCw, Filter,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const STATUS_COLORS = {
  New:        'bg-blue-50 text-blue-700 border-blue-200',
  Reviewing:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Shortlisted:'bg-green-50 text-green-700 border-green-200',
  Rejected:   'bg-red-50 text-red-700 border-red-200',
  Hired:      'bg-purple-50 text-purple-700 border-purple-200',
}

const STATUS_OPTIONS = ['New', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired']

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-divider rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-subtle">{label}</p>
      </div>
    </div>
  )
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterJob, setFilterJob] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const { addToast } = useToast()
  const PAGE_SIZE = 10

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/candidates')
    const data = await res.json()
    setCandidates(Array.isArray(data) ? data.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)) : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const jobTitles = useMemo(() => [...new Set(candidates.map((c) => c.jobTitle).filter(Boolean))], [candidates])

  const filtered = useMemo(() => {
    let list = candidates
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((c) =>
        [c.name, c.email, c.phone, c.jobTitle].some((v) => v?.toLowerCase().includes(q))
      )
    }
    if (filterJob) list = list.filter((c) => c.jobTitle === filterJob)
    if (filterStatus) list = list.filter((c) => c.status === filterStatus)
    return list
  }, [candidates, query, filterJob, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function updateStatus(id, status) {
    setUpdatingId(id)
    await fetch(`/api/admin/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
    addToast('Status updated')
    setUpdatingId(null)
  }

  async function handleDelete(candidate) {
    setDeleting(true)
    await fetch(`/api/admin/candidates/${candidate.id}`, { method: 'DELETE' })
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
    addToast('Candidate deleted')
    setDeleting(false)
    setDeleteTarget(null)
  }

  const stats = {
    total: candidates.length,
    new: candidates.filter((c) => c.status === 'New').length,
    shortlisted: candidates.filter((c) => c.status === 'Shortlisted').length,
    hired: candidates.filter((c) => c.status === 'Hired').length,
  }

  return (
    <>
      <PageHeader
        title="Candidate History"
        description={`${stats.total} total applications received`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}    label="Total Applications" value={stats.total}      color="bg-accent/10 text-accent" />
        <StatCard icon={Clock}    label="New (Unreviewed)"   value={stats.new}        color="bg-blue-50 text-blue-600" />
        <StatCard icon={Filter}   label="Shortlisted"        value={stats.shortlisted} color="bg-green-50 text-green-600" />
        <StatCard icon={Briefcase}label="Hired"              value={stats.hired}       color="bg-purple-50 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search name, email, job…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-divider-light text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <select
          value={filterJob}
          onChange={(e) => { setFilterJob(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-divider-light text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Positions</option>
          {jobTitles.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-divider-light text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-divider-light text-sm text-muted hover:bg-surface transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-divider shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-divider">
                {['Candidate', 'Position', 'Applied', 'Status', 'Resume', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-subtle uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-subtle">Loading…</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-subtle">
                    No candidates found.
                  </td>
                </tr>
              ) : paged.map((c) => (
                <>
                  <tr
                    key={c.id}
                    className="hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    {/* Candidate */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-sm">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()}
                          className="text-xs text-accent hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {c.email}
                        </a>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}
                            className="text-xs text-subtle flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Position */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">{c.jobTitle || '—'}</span>
                    </td>
                    {/* Applied */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-subtle">
                      {fmt(c.appliedAt)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status || 'New'}
                        disabled={updatingId === c.id}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        className={`text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 ${STATUS_COLORS[c.status] || STATUS_COLORS.New}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    {/* Resume */}
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {c.resumeUrl ? (
                        <a
                          href={c.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {c.resumeFileName || 'Resume'}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ) : (
                        <span className="text-xs text-subtle">No file</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded cover letter row */}
                  {expandedId === c.id && c.coverLetter && (
                    <tr key={`${c.id}-detail`} className="bg-accent/5">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1">Cover Letter</p>
                        <p className="text-sm text-muted whitespace-pre-line leading-relaxed">{c.coverLetter}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-subtle">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-surface disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this application?"
        description={`This will permanently remove ${deleteTarget?.name}'s application. This cannot be undone.`}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
