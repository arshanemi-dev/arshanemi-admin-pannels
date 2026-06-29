'use client'
import { useState, useEffect, useRef } from 'react'
import { Save, RefreshCw, Sun, Moon, Type, Sliders, Eye, ChevronDown, Check, Palette } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import ThemePreview from '@/components/admin/ThemePreview'
import { useToast } from '@/components/admin/Toast'
import { defaultTheme } from '@/data/defaultTheme'
import { COLOR_GROUPS, COLOR_LABELS, FONT_OPTIONS, RADIUS_PRESETS, SCALE_MARKS } from '@/data/themeEditorConfig'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? null : `${r}, ${g}, ${b}`
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

const SYSTEM_FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'

function loadGoogleFont(fontFamily) {
  if (fontFamily === 'Inter' || fontFamily === 'System') return
  const id = `gf-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`
  document.head.appendChild(link)
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({ colorKey, value = '#000000', onChange }) {
  const isLight = luminance(value) > 0.5
  return (
    <label className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="relative flex-shrink-0 w-8 h-8 rounded-md shadow-sm ring-1 ring-black/10 overflow-hidden"
        style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(colorKey, e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate leading-tight">
          {COLOR_LABELS[colorKey] || colorKey}
        </p>
        <p className="text-[11px] font-mono text-gray-400 leading-tight">{value}</p>
      </div>
      <div className="w-4 h-4 rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: value }}>
        <span className="text-[8px]" style={{ color: isLight ? '#000' : '#fff' }}>✏</span>
      </div>
    </label>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <Icon className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ThemePage() {
  const { toast } = useToast()
  const [theme, setTheme] = useState(defaultTheme)
  const [mode, setMode] = useState('dark')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [fontDropOpen, setFontDropOpen] = useState(false)
  const fontRef = useRef(null)

  // Close font dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (fontRef.current && !fontRef.current.contains(e.target)) setFontDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch saved theme
  useEffect(() => {
    fetch('/api/admin/theme')
      .then(r => r.json())
      .then(data => {
        setTheme(data)
        setMode(data.mode || 'dark')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Live-apply color to document (public site preview via CSS vars)
  function applyColorVar(key, value) {
    document.documentElement.style.setProperty(`--color-${key}`, value)
    const rgb = hexToRgb(value)
    if (rgb) {
      if (key === 'accent')        document.documentElement.style.setProperty('--color-accent-rgb', rgb)
      if (key === 'accent-light')  document.documentElement.style.setProperty('--color-accent-light-rgb', rgb)
      if (key === 'accent-vivid')  document.documentElement.style.setProperty('--color-accent-vivid-rgb', rgb)
      if (key === 'cyan')          document.documentElement.style.setProperty('--color-cyan-rgb', rgb)
    }
  }

  function updateColor(key, value) {
    setTheme(prev => ({ ...prev, [mode]: { ...prev[mode], [key]: value } }))
    applyColorVar(key, value)
    setDirty(true)
  }

  function updateScale(value) {
    const scale = parseFloat(value)
    setTheme(prev => ({ ...prev, typography: { ...prev.typography, scale } }))
    document.documentElement.style.setProperty('--si-font-scale', scale)
    setDirty(true)
  }

  function updateFont(fontFamily) {
    loadGoogleFont(fontFamily)
    setTheme(prev => ({ ...prev, typography: { ...prev.typography, fontFamily } }))
    document.documentElement.style.setProperty(
      '--font-sans',
      fontFamily === 'System'
        ? SYSTEM_FONT_STACK
        : `${fontFamily}, ui-sans-serif, system-ui, sans-serif`
    )
    setFontDropOpen(false)
    setDirty(true)
  }

  function applyRadiusPreset(presetKey) {
    const preset = RADIUS_PRESETS[presetKey]
    if (!preset) return
    const next = { preset: presetKey, ...preset.values }
    setTheme(prev => ({ ...prev, borderRadius: next }))
    Object.entries(preset.values).forEach(([k, v]) => {
      const cssKey = k === 'base' ? '--radius' : `--radius-${k}`
      document.documentElement.style.setProperty(cssKey, v)
    })
    setDirty(true)
  }

  function updateSiteMode(newMode) {
    setMode(newMode)
    setTheme(prev => ({ ...prev, mode: newMode }))
    document.documentElement.setAttribute('data-theme', newMode)
    const modeColors = theme[newMode] || {}
    Object.entries(modeColors).forEach(([k, v]) => applyColorVar(k, v))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      // Bust client-side cache so ThemeContext picks up new values
      localStorage.removeItem('si-theme-config')
      toast('Theme saved — changes are live!', 'success')
      setDirty(false)
    } catch (err) {
      toast(err.message || 'Failed to save theme', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Reset all theme settings to factory defaults?')) return
    setTheme(defaultTheme)
    // Re-apply defaults to document
    Object.entries(defaultTheme[mode]).forEach(([k, v]) => applyColorVar(k, v))
    document.documentElement.style.setProperty('--si-font-scale', '1')
    document.documentElement.style.setProperty('--font-sans', SYSTEM_FONT_STACK)
    await fetch('/api/admin/theme', { method: 'DELETE' })
    localStorage.removeItem('si-theme-config')
    toast('Reset to defaults', 'info')
    setDirty(false)
  }

  const colors = theme[mode] || {}
  const { typography = {}, borderRadius = {} } = theme
  const scale = typography.scale ?? 1.0
  const fontFamily = typography.fontFamily || 'System'
  const fontFamilyCSS = fontFamily === 'System' ? SYSTEM_FONT_STACK : `${fontFamily}, sans-serif`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Theme Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Customise colors, typography & layout — changes apply live to the public site.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* ── Site Mode Switch ── */}
          <div className="flex items-center gap-1.5 px-1.5 py-1.5 bg-gray-100 rounded-xl border border-gray-200">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider pl-1 pr-0.5">
              Live Mode:
            </span>
            {['dark', 'light'].map(m => (
              <button key={m} onClick={() => updateSiteMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  theme.mode === m
                    ? m === 'dark'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {m === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {m === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Left — controls */}
        <div className="space-y-5">

          {/* ── Colors ──────────────────────────────────── */}
          <Section icon={Palette} title="Color Palette">
            {/* Palette editing tabs */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                {['dark', 'light'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      mode === m
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {m === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    {m === 'dark' ? 'Dark Palette' : 'Light Palette'}
                  </button>
                ))}
              </div>
              {theme.mode === mode && (
                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  ● Live on site
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {COLOR_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1 mt-3">
                    {group.label}
                  </p>
                  {group.keys.map(key => (
                    <ColorSwatch
                      key={key}
                      colorKey={key}
                      value={colors[key] || '#000000'}
                      onChange={updateColor}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Typography ──────────────────────────────── */}
          <Section icon={Type} title="Typography">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Font family */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Font Family</label>
                <div ref={fontRef} className="relative">
                  <button
                    onClick={() => setFontDropOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-sm font-medium text-gray-800 transition-colors"
                    style={{ fontFamily: fontFamilyCSS }}>
                    {fontFamily}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${fontDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {fontDropOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 max-h-52 overflow-y-auto">
                      {FONT_OPTIONS.map(f => (
                        <button key={f.value} onClick={() => updateFont(f.value)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                          style={{ fontFamily: f.value === 'System' ? SYSTEM_FONT_STACK : `${f.value}, sans-serif` }}>
                          <span>{f.label}</span>
                          {fontFamily === f.value && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">Applied to the entire public site.</p>
              </div>

              {/* Font scale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">UI Font Scale</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {(scale * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range" min="0.8" max="1.3" step="0.05"
                  value={scale}
                  onChange={e => updateScale(e.target.value)}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between mt-1">
                  {SCALE_MARKS.map(m => (
                    <span key={m.value}
                      className={`text-[10px] ${Math.abs(m.value - scale) < 0.01 ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                      {m.label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  Scales the base font size (16px × scale). Affects all rem values.
                </p>
              </div>
            </div>

            {/* Font preview strip */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100" style={{ fontFamily: fontFamilyCSS }}>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview — {fontFamily}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">Heading Bold 700</p>
              <p className="text-base font-medium text-gray-700">Semibold 600 — subheading text</p>
              <p className="text-sm text-gray-500 mt-1">Regular 400 — the quick brown fox jumps over the lazy dog.</p>
              <p className="text-xs text-gray-400 mt-1">Small 300 — caption and fine print text goes here</p>
            </div>
          </Section>

          {/* ── Border Radius ────────────────────────────── */}
          <Section icon={Sliders} title="Border Radius">
            <div>
              <p className="text-xs text-gray-500 mb-3">Choose a preset or apply a global corner style.</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.entries(RADIUS_PRESETS).map(([key, preset]) => {
                  const active = borderRadius.preset === key
                  const previewR = preset.values.lg
                  return (
                    <button key={key} onClick={() => applyRadiusPreset(key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className="w-10 h-10 border-2 border-current transition-colors"
                        style={{
                          borderRadius: previewR,
                          borderColor: active ? '#6366f1' : '#9ca3af',
                        }} />
                      <span className={`text-xs font-semibold ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {preset.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Fine-tune values */}
              <details className="group">
                <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1 list-none">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                  Fine-tune individual values
                </summary>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['sm', 'base', 'md', 'lg', 'xl', '2xl'].map(k => (
                    <div key={k}>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        {k === 'base' ? 'rounded (base)' : `rounded-${k}`}
                      </label>
                      <input
                        type="text"
                        value={borderRadius[k] || ''}
                        onChange={e => {
                          const val = e.target.value
                          setTheme(prev => ({ ...prev, borderRadius: { ...prev.borderRadius, [k]: val } }))
                          const cssKey = k === 'base' ? '--radius' : `--radius-${k}`
                          document.documentElement.style.setProperty(cssKey, val)
                          setDirty(true)
                        }}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="e.g. 8px"
                      />
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </Section>
        </div>

        {/* Right — sticky live preview */}
        <div className="xl:sticky xl:top-6 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-800">Live Preview</h3>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-md">
                {['dark', 'light'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}>
                    {m === 'dark' ? '☾' : '☀'} {m}
                  </button>
                ))}
              </div>
            </div>
            <ThemePreview theme={theme} mode={mode} />
          </div>

          {/* Scale preview badge */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Scale Preview</p>
            <div className="space-y-1.5">
              {[{ size: `${(14 * scale).toFixed(1)}px`, label: 'text-sm', sample: 'Small text' },
                { size: `${(16 * scale).toFixed(1)}px`, label: 'text-base', sample: 'Base text' },
                { size: `${(18 * scale).toFixed(1)}px`, label: 'text-lg', sample: 'Large text' },
                { size: `${(24 * scale).toFixed(1)}px`, label: 'text-2xl', sample: 'Heading' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium" style={{ fontSize: r.size, fontFamily: fontFamilyCSS, lineHeight: 1.2 }}>
                    {r.sample}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{r.label} · {r.size}</span>
                </div>
              ))}
            </div>
          </div>

          {dirty && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
              ⚠ You have unsaved changes. Click "Save Changes" to publish.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
