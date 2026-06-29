'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { defaultTheme } from '@/data/defaultTheme'

const IS_CONNECT      = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'
const THEME_CACHE_KEY = 'si-theme-config'
const THEME_CACHE_TTL = 10 * 60 * 1000 // 10 min

const ThemeContext = createContext({ theme: 'dark', siteTheme: defaultTheme })

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return isNaN(r) ? null : `${r}, ${g}, ${b}`
}

function applyColors(colors) {
  const root = document.documentElement
  Object.entries(colors).forEach(([key, val]) => {
    root.style.setProperty(`--color-${key}`, val)
  })
  const rgb = (k) => colors[k] && hexToRgb(colors[k])
  if (rgb('accent'))        root.style.setProperty('--color-accent-rgb', rgb('accent'))
  if (rgb('accent-light'))  root.style.setProperty('--color-accent-light-rgb', rgb('accent-light'))
  if (rgb('accent-vivid'))  root.style.setProperty('--color-accent-vivid-rgb', rgb('accent-vivid'))
  if (rgb('cyan'))          root.style.setProperty('--color-cyan-rgb', rgb('cyan'))
}

const SYSTEM_FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'

function applyTypography(typography) {
  if (!typography) return
  const root = document.documentElement
  if (typography.fontFamily) {
    const f = typography.fontFamily
    if (f === 'System') {
      root.style.setProperty('--font-sans', SYSTEM_FONT_STACK)
    } else {
      root.style.setProperty('--font-sans', `${f}, ui-sans-serif, system-ui, -apple-system, sans-serif`)
      if (f !== 'Inter') {
        const id = `gf-${f.replace(/\s+/g, '-').toLowerCase()}`
        if (!document.getElementById(id)) {
          const link = document.createElement('link')
          link.id = id
          link.rel = 'stylesheet'
          link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`
          document.head.appendChild(link)
        }
      }
    }
  }
  if (typography.scale != null) {
    root.style.setProperty('--si-font-scale', String(typography.scale))
  }
}

function applyBorderRadius(borderRadius) {
  if (!borderRadius) return
  Object.entries(borderRadius).forEach(([k, v]) => {
    if (k === 'preset') return
    const cssKey = k === 'base' ? '--radius' : `--radius-${k}`
    document.documentElement.style.setProperty(cssKey, v)
  })
}

function applyFullTheme(siteTheme) {
  const mode = siteTheme.mode || 'dark'
  const colors = siteTheme[mode] || siteTheme.dark || {}
  document.documentElement.setAttribute('data-theme', mode)
  applyColors(colors)
  applyTypography(siteTheme.typography)
  applyBorderRadius(siteTheme.borderRadius)
}

export function ThemeProvider({ children }) {
  const [siteTheme, setSiteTheme] = useState(defaultTheme)

  useEffect(() => {
    if (!IS_CONNECT) {
      // Local / disconnected mode — try localStorage cache, else use code defaults
      try {
        const raw = localStorage.getItem(THEME_CACHE_KEY)
        if (raw) {
          const { data, ts } = JSON.parse(raw)
          if (Date.now() - ts < THEME_CACHE_TTL && data?.mode) {
            setSiteTheme(data)
            applyFullTheme(data)
            return
          }
        }
      } catch {}
      // No cache — just apply defaultTheme from code (no API call)
      applyFullTheme(defaultTheme)
      return
    }

    // Connected mode — try localStorage cache first to avoid FOUC on navigation
    try {
      const raw = localStorage.getItem(THEME_CACHE_KEY)
      if (raw) {
        const { data, ts } = JSON.parse(raw)
        if (Date.now() - ts < THEME_CACHE_TTL && data?.mode) {
          setSiteTheme(data)
          applyFullTheme(data)
          return
        }
      }
    } catch {}

    // Fetch from API
    fetch('/api/admin/theme')
      .then(r => r.json())
      .then(data => {
        setSiteTheme(data)
        applyFullTheme(data)
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
      })
      .catch(() => {
        // globals.css defaults are already active — nothing to do
      })
  }, [])

  // mode exposed for any component that needs to read it (e.g. conditional shadow)
  const theme = siteTheme.mode || 'dark'

  return (
    <ThemeContext.Provider value={{ theme, siteTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
