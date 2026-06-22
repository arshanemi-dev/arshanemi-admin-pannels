import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const PUBLIC_PATHS = ['/admin/login', '/api/auth/login']

export async function proxy(req) {
  const { pathname } = req.nextUrl

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (!isAdminPath) return NextResponse.next()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) {
    const res = NextResponse.next()
    res.headers.set('x-pathname', pathname)
    return res
  }

  const token = req.cookies.get('admin-token')?.value
  if (!token) {
    const loginUrl = new URL('/admin/login', req.url)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const res = NextResponse.next()
    res.headers.set('X-Admin-User', payload.username ?? '')
    res.headers.set('x-pathname', pathname)
    return res
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
