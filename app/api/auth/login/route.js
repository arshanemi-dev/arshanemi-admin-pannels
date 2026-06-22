import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile } from '@/lib/db'

export async function POST(req) {
  const { identifier, password, username } = await req.json()

  // Support legacy admin login (username field) for backward compatibility
  const id = identifier || username

  if (!id || !password) {
    return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
  }

  try {
    // Look up user by email or mobile
    const isEmail = id.includes('@')
    const user = isEmail
      ? await getUserByEmail(id.toLowerCase().trim())
      : await getUserByMobile(id.trim())

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, name: user.name })
    const cookie = makeAuthCookie(token)

    const res = NextResponse.json({ ok: true, role: user.role, name: user.name })
    res.cookies.set(cookie)

    // Also set admin-token cookie for admin panel compatibility
    if (user.role === 'admin') {
      res.cookies.set({ ...cookie, name: 'admin-token' })
    }

    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 })
  }
}
