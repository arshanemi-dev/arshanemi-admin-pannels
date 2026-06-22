import Link from 'next/link'
import { Plus, ChevronLeft } from 'lucide-react'

export function PageHeader({ title, description, newHref, backHref }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link href={backHref}
            className="mt-0.5 p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {newHref && (
        <Link
          href={newHref}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Link>
      )}
    </div>
  )
}

export function SaveBar({ onSave, loading, onPreview, previewHref }) {
  return (
    <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 z-10 shadow-sm">
      {(onPreview || previewHref) && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Preview ↗
        </a>
      )}
      <button
        type="submit"
        disabled={loading}
        onClick={onSave}
        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {loading ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
