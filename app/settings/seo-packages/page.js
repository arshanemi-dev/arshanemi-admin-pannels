'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { useToast } from '@/components/admin/Toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { PackageGridSkeleton, LoadError } from '@/components/admin/Skeleton'

export default function SEOPackagesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  function load() {
    setError(false)
    setLoading(true)
    fetch('/api/admin/seo-packages')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(load, [])

  async function handleDelete(pkg) {
    setDeleting(true)
    const res = await fetch(`/api/admin/seo-packages/${pkg.id}`, { method: 'DELETE' })
    if (res.ok) {
      setData((d) => d.filter((p) => p.id !== pkg.id))
      addToast('Package deleted')
    } else {
      addToast('Delete failed', 'error')
    }
    setDeleting(false)
    setConfirm(null)
  }

  return (
    <>
      <PageHeader title="SEO Packages" description="Pricing packages" newHref="/settings/seo-packages/new" />

      {loading ? (
        <PackageGridSkeleton />
      ) : error ? (
        <LoadError onRetry={load} />
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-subtle text-sm">
          No packages yet — click <span className="font-semibold text-accent">+ New</span> to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.map((pkg) => (
            <div key={pkg.id} className="bg-card rounded-2xl border border-divider shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{pkg.name}</h3>
                  <p className="text-sm text-subtle mt-0.5 truncate">{pkg.tagline}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Link
                    href={`/settings/seo-packages/${pkg.id}`}
                    className="p-1.5 rounded-lg text-subtle hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setConfirm(pkg)}
                    className="p-1.5 rounded-lg text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {pkg.currency}{pkg.price}
                <span className="text-sm font-normal text-subtle">/{pkg.period}</span>
              </div>
              {pkg.badge && (
                <span className="inline-block mt-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  {pkg.badge}
                </span>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(pkg.teaserFeatures || []).map((f, i) => (
                  <span key={i} className="text-xs bg-surface text-muted px-2 py-1 rounded-lg">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Delete "${confirm?.name}" package?`}
        description="This will permanently remove this package and cannot be undone."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </>
  )
}
