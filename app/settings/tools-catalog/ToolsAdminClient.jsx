'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2, ExternalLink, Link2, Lock } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import DataTable from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

const TOOL_CATEGORIES = [
  { id: 'research',   label: 'Research Tools' },
  { id: 'analytics',  label: 'Analytics Tools' },
  { id: 'listing',    label: 'Listing Tools' },
  { id: 'embedded',   label: 'Embedded Tools' },
]

export default function ToolsAdminClient({ initialTools }) {
  const [tools, setTools] = useState(initialTools || [])
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  async function handleDelete(tool) {
    setDeleting(true)
    try {
      await fetch(`/api/admin/tools/${tool.id}`, { method: 'DELETE' })
      setTools((t) => t.filter((x) => x.id !== tool.id))
      addToast(`"${tool.title}" deleted`)
    } catch {
      addToast('Delete failed', 'error')
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Tool',
      sortable: true,
      render: (_, tool) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-bold">{tool.icon?.[0] || 'T'}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground">{tool.title}</p>
              {tool.toolUrl && (
                <span title="Embeddable — has a Use Tool link">
                  <Link2 className="w-3 h-3 text-accent" />
                </span>
              )}
              {tool.requiresLogin && (
                <span title="Requires login">
                  <Lock className="w-3 h-3 text-amber-500" />
                </span>
              )}
            </div>
            <p className="text-subtle text-xs line-clamp-1 max-w-xs">{tool.shortDesc}</p>
          </div>
        </div>
      ),
    },
    { key: 'slug', label: 'Slug', render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'category',
      label: 'Category',
      render: (v) => (
        <span className="bg-accent/10 text-accent-hover text-xs font-medium px-2.5 py-1 rounded-full">
          {TOOL_CATEGORIES.find((c) => c.id === v)?.label || v}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Tools"
        description={`${tools.length} tools total`}
        newHref="/settings/tools-catalog/new"
      />

      <DataTable
        columns={columns}
        data={tools}
        searchKeys={['title', 'slug']}
        emptyText='No tools found. Click "Add New" to create one.'
        actions={(tool) => (
          <div className="flex gap-2 justify-end">
            <Link
              href={`/tools/${tool.slug}`}
              target="_blank"
              className="p-1.5 rounded-lg text-subtle hover:text-muted hover:bg-surface"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href={`/settings/tools-catalog/${tool.id}`}
              className="p-1.5 rounded-lg text-subtle hover:text-accent hover:bg-accent/10"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setConfirm(tool)}
              className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.title}"?`}
        description="This cannot be undone."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </>
  )
}
