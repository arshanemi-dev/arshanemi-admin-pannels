'use client'
import { useState, useEffect } from 'react'
import { CheckCheck, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import { useToast } from '@/components/admin/Toast'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function SettingsPage() {
  const [users, setUsers] = useState(null)
  const [tools, setTools] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  function load() {
    setError(false)
    setUsers(null)
    setTools(null)
    Promise.all([
      fetch('/api/admin/users').then((r) => { if (!r.ok) throw new Error(); return r.json() }),
      fetch('/api/admin/tools').then((r) => { if (!r.ok) throw new Error(); return r.json() }),
      fetch('/api/admin/user-settings').then((r) => { if (!r.ok) throw new Error(); return r.json() }),
    ])
      .then(([usersData, toolsData, accessMap]) => {
        setUsers(usersData)
        setTools(toolsData)
        setRows(buildRows(usersData, toolsData, accessMap || {}))
      })
      .catch(() => setError(true))
  }

  useEffect(load, [])

  function buildRows(usersData, toolsData, accessMap) {
    return usersData.map((u) => {
      const granted = accessMap[u.id]
      const row = { id: u.id, name: u.name, email: u.email, role: u.role }
      toolsData.forEach((t) => {
        // No explicit record yet = full access by default.
        row[t.slug] = granted ? granted.includes(t.slug) : true
      })
      return row
    })
  }

  function toggle(userId, slug) {
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, [slug]: !r[slug] } : r)))
  }

  function setAllForUser(userId, value) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== userId) return r
      const next = { ...r }
      tools.forEach((t) => { next[t.slug] = value })
      return next
    }))
  }

  function grantAllToAllUsers() {
    setRows((prev) => prev.map((r) => {
      const next = { ...r }
      tools.forEach((t) => { next[t.slug] = true })
      return next
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const access = {}
      rows.forEach((r) => {
        access[r.id] = tools.filter((t) => r[t.slug]).map((t) => t.slug)
      })
      const res = await fetch('/api/admin/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(access),
      })
      if (res.ok) addToast('Tools access saved!')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error — please try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <LoadError onRetry={load} />
  if (!users || !tools) return <TableSkeleton rows={6} />

  const columns = [
    {
      key: 'name', label: 'User', sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role', sortable: true,
      render: (v) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          v === 'master_admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {v}
        </span>
      ),
    },
    ...tools.map((t) => ({
      key: t.slug,
      label: t.title,
      render: (v, row) => (
        <input
          type="checkbox"
          checked={!!v}
          onChange={() => toggle(row.id, t.slug)}
          className="w-4 h-4 accent-indigo-600 cursor-pointer"
        />
      ),
    })),
    {
      key: '_quick', label: '',
      render: (_v, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            title="Grant all tools"
            onClick={() => setAllForUser(row.id, true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Revoke all tools"
            onClick={() => setAllForUser(row.id, false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Settings — Tools Access"
        description="Control which tools each registered user can access. New signups get every tool by default."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={grantAllToAllUsers}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Grant all tools to all users
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchKeys={['name', 'email']}
        emptyText="No registered users yet."
      />

      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 z-10 shadow-sm">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
