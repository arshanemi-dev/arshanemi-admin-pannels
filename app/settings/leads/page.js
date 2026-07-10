'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, Search, Mail, Phone, MessageSquare,
  ChevronLeft, ChevronRight, RefreshCw, Trash2,
  Globe, MousePointerClick, Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const STATUS_COLORS = {
  New:        'bg-blue-50 text-blue-700 border-blue-200',
  Contacted:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Qualified:  'bg-green-50 text-green-700 border-green-200',
  Converted:  'bg-purple-50 text-purple-700 border-purple-200',
  Lost:       'bg-red-50 text-red-700 border-red-200',
}

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']

const SOURCE_BADGE = {
  contact: { label: 'Contact Form', icon: Globe,            cls: 'bg-accent/10 text-accent-hover border-accent/30' },
  popup:   { label: 'Popup / SEO',  icon: MousePointerClick, cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}

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

function SourceBadge({ source }) {
  const cfg = SOURCE_BADGE[source] || { label: source, icon: Globe, cls: 'bg-surface text-muted border-divider' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const { addToast } = useToast()
  const PAGE_SIZE = 15

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/leads')
    const data = await res.json()
    setLeads(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = leads
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((l) =>
        [l.name, l.email, l.phone, l.service, l.interest, l.message].some((v) => v?.toLowerCase().includes(q))
      )
    }
    if (filterSource) list = list.filter((l) => l.source === filterSource)
    if (filterStatus) list = list.filter((l) => l.status === filterStatus)
    return list
  }, [leads, query, filterSource, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function updateStatus(id, status) {
    setUpdatingId(id)
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    addToast('Status updated')
    setUpdatingId(null)
  }

  async function handleDelete(lead) {
    setDeleting(true)
    await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
    addToast('Lead deleted')
    setDeleting(false)
    setDeleteTarget(null)
  }

  const stats = {
    total:     leads.length,
    contact:   leads.filter((l) => l.source === 'contact').length,
    popup:     leads.filter((l) => l.source === 'popup').length,
    converted: leads.filter((l) => l.status === 'Converted').length,
  }

  return (
    <>
      <PageHeader
        title="Leads History"
        description={`${stats.total} total leads — ${stats.contact} from Contact Form, ${stats.popup} from Popup`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp}       label="Total Leads"       value={stats.total}     color="bg-accent/10 text-accent" />
        <StatCard icon={Globe}            label="Contact Form"      value={stats.contact}   color="bg-blue-50 text-blue-600" />
        <StatCard icon={MousePointerClick}label="Popup / SEO Audit" value={stats.popup}     color="bg-cyan-50 text-cyan-600" />
        <StatCard icon={Clock}            label="Converted"         value={stats.converted} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search name, email, service…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-divider-light text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-divider-light text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Sources</option>
          <option value="contact">Contact Form</option>
          <option value="popup">Popup / SEO Audit</option>
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
                {['Source', 'Contact', 'Service / Interest', 'Received', 'Status', 'Actions'].map((h) => (
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
                    No leads found. Submit the contact or popup form to see entries here.
                  </td>
                </tr>
              ) : paged.map((l) => (
                <>
                  <tr
                    key={l.id}
                    className="hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  >
                    {/* Source */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SourceBadge source={l.source} />
                    </td>
                    {/* Contact info */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-sm">{l.name}</p>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <a
                          href={`mailto:${l.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" /> {l.email}
                        </a>
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-subtle flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {l.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Service / Interest */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground font-medium">
                        {l.service || l.interest || '—'}
                      </p>
                      {l.budget && (
                        <p className="text-xs text-subtle mt-0.5">Budget: {l.budget}</p>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-subtle">
                      {fmt(l.createdAt)}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={l.status || 'New'}
                        disabled={updatingId === l.id}
                        onChange={(e) => updateStatus(l.id, e.target.value)}
                        className={`text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 ${STATUS_COLORS[l.status] || STATUS_COLORS.New}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTarget(l)}
                        className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded message row */}
                  {expandedId === l.id && l.message && (
                    <tr key={`${l.id}-msg`} className="bg-blue-50/40">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </p>
                        <p className="text-sm text-muted whitespace-pre-line leading-relaxed">{l.message}</p>
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
        title="Delete this lead?"
        description={`This will permanently remove the lead from ${deleteTarget?.name}. This cannot be undone.`}
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
