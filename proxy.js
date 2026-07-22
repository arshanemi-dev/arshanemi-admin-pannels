import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const PUBLIC_PATHS = ['/settings/login', '/api/auth/login']

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',').map((o) => o.trim())

function setCorsHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.headers.set('Access-Control-Allow-Origin', allowed)
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Vary', 'Origin')
}

export async function proxy(req) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin') || ''

  // Handle CORS preflight for all API routes
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const res = new NextResponse(null, { status: 204 })
    setCorsHeaders(res, origin)
    return res
  }

  const isAdminPath = pathname.startsWith('/settings') || pathname.startsWith('/api/admin')

  // Non-admin API routes (e.g. /api/auth/*) and the standalone auth pages
  // (/login, /signup, ...): inject CORS headers where relevant and pass
  // through, but still stamp x-pathname so the root layout can tell these
  // full-bleed auth screens apart from regular public pages and skip the
  // site Header/Footer for them.
  if (!isAdminPath) {
    const res = NextResponse.next()
    res.headers.set('x-pathname', pathname)
    if (pathname.startsWith('/api/')) setCorsHeaders(res, origin)
    return res
  }

  // Theme is read by the public site (ThemeContext) for every visitor, and
  // promoOffer by the public Plan page (PromoBadge), so GET must be readable
  // without an admin session for both — PUT/DELETE still require auth.
  const PUBLIC_ADMIN_GET_PATHS = ['/api/admin/theme', '/api/admin/singleton/promoOffer']
  const isPublicAdminGet = PUBLIC_ADMIN_GET_PATHS.includes(pathname) && req.method === 'GET'
  const isPublic = isPublicAdminGet || PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) {
    const res = NextResponse.next()
    res.headers.set('x-pathname', pathname)
    setCorsHeaders(res, origin)
    return res
  }

  // Any authenticated role (master_admin / admin / user) gets an
  // 'arshanemi-token' cookie on login; only master_admin additionally gets
  // 'admin-token'. Structural access to /settings is granted to any logged-in
  // role here — the layout and API routes below decide what each role can
  // actually see/do, same defense-in-depth pattern already used elsewhere.
  //
  // Bearer header checked first, same priority as lib/auth.js's
  // getAuthPayload() — server-to-server callers (e.g. the tools dashboard's
  // connect-mode proxy in tools/arshanemi-tools-dashboard/lib/connect.js)
  // have no cookie jar for this origin and can only ever send a bearer
  // token; without this fallback every /api/admin/* call from a proxying
  // caller 401s here before the route handler even runs, no matter how
  // valid the token is.
  const authHeader = req.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = bearerToken || req.cookies.get('admin-token')?.value || req.cookies.get('arshanemi-token')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      setCorsHeaders(res, origin)
      return res
    }
    const loginUrl = new URL('/settings/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const res = NextResponse.next()
    res.headers.set('X-Admin-User', payload.name ?? '')
    res.headers.set('x-pathname', pathname)
    setCorsHeaders(res, origin)
    return res
  } catch {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      setCorsHeaders(res, origin)
      return res
    }
    const loginUrl = new URL('/settings/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/settings/:path*', '/api/:path*', '/login', '/signup', '/forgot-password', '/reset-password'],
}
