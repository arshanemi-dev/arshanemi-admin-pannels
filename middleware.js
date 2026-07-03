import { NextResponse } from 'next/server'

// CORS for external static clients (e.g. tools/arshanemi-tools-dashboard) that
// call this admin panel's /api/* routes directly from the browser with a
// Bearer token. This only adds CORS headers — every route still does its own
// auth check (see lib/auth.js), so this cannot widen access on its own.
const DEFAULT_ORIGINS = ['http://localhost:5500', 'http://127.0.0.1:5500']
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function withCors(res, origin) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export function middleware(req) {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return withCors(new NextResponse(null, { status: 204 }), origin)
  }

  return withCors(NextResponse.next(), origin)
}

export const config = {
  matcher: ['/api/:path*'],
}
