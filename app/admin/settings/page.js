'use client'
import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'
import { TableSkeleton, LoadError } from '@/components/admin/Skeleton'
import ToolAccessCard from './ToolAccessCard'

export default function SettingsPage() {
  const [users, setUsers] = useState(null)
  const [tools, setTools] = useState(null)
  const [access, setAccess] = useState({}) // { [userId]: { [slug]: boolean } }
  const [expanded, setExpanded] = useState({}) // { [userId]: boolean }
  const [search, setSearch] = useState('')
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
        setAccess(buildAccess(usersData, toolsData, accessMap || {}))
      })
      .catch(() => setError(true))
  }

  useEffect(load, [])

  function buildAccess(usersData, toolsData, accessMap) {
    const next = {}
    usersData.forEach((u) => {
      const granted = accessMap[u.id]
      const map = {}
      // No explicit record yet = full access by default.
      toolsData.forEach((t) => { map[t.slug] = granted ? granted.includes(t.slug) : true })
      next[u.id] = map
    })
    return next
  }

  function toggleTool(userId, slug) {
    setAccess((prev) => ({ ...prev, [userId]: { ...prev[userId], [slug]: !prev[userId]?.[slug] } }))
  }

  function setAllForUser(userId, value) {
    setAccess((prev) => {
      const map = {}
      tools.forEach((t) => { map[t.slug] = value })
      return { ...prev, [userId]: map }
    })
  }

  function grantAllToAllUsers() {
    setAccess((prev) => {
      const next = {}
      Object.keys(prev).forEach((userId) => {
        const map = {}
        tools.forEach((t) => { map[t.slug] = true })
        next[userId] = map
      })
      return next
    })
  }

  function toggleExpand(userId) {
    setExpanded((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {}
      Object.entries(access).forEach(([userId, map]) => {
        body[userId] = tools.filter((t) => map[t.slug]).map((t) => t.slug)
      })
      const res = await fetch('/api/admin/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) addToast('Tools access saved!')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Network error — please try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
  }, [users, search])

  if (error) return <LoadError onRetry={load} />
  if (!users || !tools) return <TableSkeleton rows={6} />

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Tools Access"
        description="Control which tools each registered user can access. New signups get every tool by default."
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full rounded-xl border border-divider-light bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={grantAllToAllUsers}
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          Grant all tools to all users
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-subtle text-sm">No users match your search.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredUsers.map((u) => (
            <ToolAccessCard
              key={u.id}
              user={u}
              tools={tools}
              access={access[u.id] || {}}
              expanded={!!expanded[u.id]}
              onToggleExpand={() => toggleExpand(u.id)}
              onToggleTool={(slug) => toggleTool(u.id, slug)}
              onSetAll={(value) => setAllForUser(u.id, value)}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-60 right-0 bg-card border-t border-divider px-8 py-4 flex items-center justify-end gap-3 z-10 shadow-sm">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
