'use client'
import { ChevronDown, CheckCheck, XCircle } from 'lucide-react'

const ROLE_STYLES = {
  admin: 'bg-accent/10 text-accent-hover',
  master_admin: 'bg-purple-50 text-purple-700',
}

export default function ToolAccessCard({ user, tools, access, expanded, onToggleExpand, onToggleTool, onSetAll }) {
  const grantedCount = tools.filter((t) => access[t.slug]).length

  return (
    <div className="bg-card rounded-2xl border border-divider overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold flex-shrink-0">
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{user.name}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_STYLES[user.role] || 'bg-surface text-muted'}`}>
              {user.role}
            </span>
          </div>
          <p className="text-xs text-subtle truncate">{user.email || user.mobile}</p>
        </div>

        <div className="hidden sm:block flex-shrink-0">
          {grantedCount === tools.length ? (
            <span className="text-xs font-medium text-green-700 bg-green-50 rounded-full px-2.5 py-1">All tools</span>
          ) : grantedCount === 0 ? (
            <span className="text-xs font-medium text-red-700 bg-red-50 rounded-full px-2.5 py-1">No tools</span>
          ) : (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
              {grantedCount} of {tools.length} tools
            </span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-subtle flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-divider px-5 py-4">
          <div className="flex items-center justify-end gap-3 mb-3">
            <button
              type="button"
              onClick={() => onSetAll(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-subtle hover:text-green-600 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Grant all
            </button>
            <span className="text-divider-light">|</span>
            <button
              type="button"
              onClick={() => onSetAll(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-subtle hover:text-red-600 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Revoke all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tools.map((t) => {
              const on = !!access[t.slug]
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => onToggleTool(t.slug)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    on ? 'border-accent/30 bg-accent/10' : 'border-divider bg-card hover:bg-surface'
                  }`}
                >
                  <span className={`text-sm font-medium truncate ${on ? 'text-accent-hover' : 'text-muted'}`}>
                    {t.title}
                  </span>
                  <span
                    role="switch"
                    aria-checked={on}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      on ? 'bg-accent' : 'bg-divider-light'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${
                        on ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
