'use client'
import { useEffect } from 'react'
import { getRefreshToken, saveAuthTokens, clearAuthTokens, isTokenExpired } from '@/lib/tokenStore'

// Keeps the httpOnly access-token cookie alive without ever bouncing the user
// to a login page while their 7-day refresh token is still good. Mounted both
// under /settings (loginPath="/settings/login", the default) and at the
// public site root (loginPath="/login") — see app/layout.js. Two mechanisms:
//   1. Reactive — a one-time, idempotent patch of window.fetch that catches
//      any 401 from a same-origin /api/* call (the access token expired
//      between requests), silently refreshes, and retries the original call
//      once. No existing fetch('/api/admin/...') call site anywhere in the
//      app needs to change for this to work.
//   2. Proactive — a periodic check against the expiresAt mirror kept in
//      localStorage (tokenStore.js) so most requests never even hit a 401.
// If the refresh token itself is invalid/expired, both paths fall through to
// forceLogout(): clears the httpOnly cookie(s) server-side, clears the
// localStorage mirror, and hard-redirects to the current section's login page.
//
// currentLoginPath is read at call-time (not baked into the fetch patch at
// install-time) because the interceptor itself is installed only once per
// tab (see `patched` below) — a user who visits /settings then a public
// /tools page in the same session re-mounts SessionManager with a different
// loginPath, and the shared interceptor needs to redirect to whichever
// section's login page applies to where the user currently is.

let patched = false
let realFetch = null
let refreshInFlight = null
let currentLoginPath = '/settings/login'

async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = realFetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = await res.json()
        saveAuthTokens({ accessToken: data.accessToken, refreshToken, expiresIn: data.expiresIn })
        return true
      })
      .catch(() => false)
      .finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

async function forceLogout() {
  clearAuthTokens()
  try { await realFetch('/api/auth/logout', { method: 'POST' }) } catch { /* cookie may already be gone */ }
  window.location.href = currentLoginPath
}

function installFetchInterceptor() {
  if (patched || typeof window === 'undefined') return
  patched = true
  realFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    const isAuthRoute = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'].some((p) => url.includes(p))
    const isApiCall = url.startsWith('/api') || url.includes(window.location.origin + '/api')

    const res = await realFetch(input, init)
    if (res.status !== 401 || isAuthRoute || !isApiCall) return res

    const refreshed = await tryRefresh()
    if (!refreshed) {
      forceLogout()
      return res
    }
    return realFetch(input, init)
  }
}

export default function SessionManager({ loginPath = '/settings/login' }) {
  useEffect(() => {
    currentLoginPath = loginPath
    installFetchInterceptor()

    const interval = setInterval(async () => {
      if (getRefreshToken() && isTokenExpired()) {
        const ok = await tryRefresh()
        if (!ok) forceLogout()
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [loginPath])

  return null
}
