'use client'
import { useState, useMemo } from 'react'
import * as Icons from 'lucide-react'

// Common Lucide icon names used in the project
const ICON_NAMES = [
  'Activity','AlertCircle','AlertTriangle','Archive','ArrowRight','Award',
  'BarChart2','BarChart3','Bell','BookOpen','Briefcase','Building2',
  'Calendar','Check','CheckCircle','ChevronDown','ChevronRight','Clock',
  'Code','Cog','Compass','Copy','CreditCard','Database',
  'Edit','ExternalLink','Eye','Factory','FileText','Filter',
  'Globe','Grid','Hash','Heart','HelpCircle','Home',
  'Image','Info','Key','Layers','Layout','Lightbulb',
  'Link','List','Lock','LogOut','Mail','Map','MapPin',
  'MessageSquare','Monitor','Moon','MoreHorizontal','Package',
  'Phone','PieChart','Play','Plus','Search','Settings','Share',
  'Shield','ShieldCheck','ShoppingCart','Smile','Star','Sun',
  'Tag','Target','ThumbsUp','Trash','TrendingUp','Type',
  'Upload','User','Users','Video','Wallet','Zap','ZoomIn',
]

const SearchIcon = Icons.Search

export default function IconPicker({ value, onChange, label = 'Icon' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query) return ICON_NAMES
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  const SelectedIcon = value && Icons[value] ? Icons[value] : null

  return (
    <div className="flex flex-col gap-1.5 relative">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex gap-2">
        {/* Preview + name input */}
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 bg-white">
          {SelectedIcon
            ? <SelectedIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            : <span className="w-4 h-4 flex-shrink-0" />
          }
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Globe, BarChart3, Users"
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Browse
        </button>
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-3">
          <div className="relative mb-3">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter icons…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-5 gap-1 max-h-56 overflow-y-auto pr-1">
            {filtered.map((name) => {
              const Icon = Icons[name]
              if (!Icon) return null
              const active = value === name
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); setQuery('') }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[9px] leading-tight text-center w-full truncate">{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
