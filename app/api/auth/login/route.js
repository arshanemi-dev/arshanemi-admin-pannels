import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, signRefreshToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile } from '@/lib/db'

export async function POST(req) {
  const { identifier, password, username } = await req.json()

  // Support legacy admin login (username field) for backward compatibility
  const id = identifier || username

  if (!id || !password) {
    return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
  }

  try {
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

    const tokenPayload = { userId: user.id, email: user.email, role: user.role, name: user.name }

    // Short-lived access token (15 min) + long-lived refresh token (7 days)
    const accessToken  = await signToken(tokenPayload, '15m')
    const refreshToken = await signRefreshToken({ userId: user.id, role: user.role })

    const cookie = makeAuthCookie(accessToken)

    const res = NextResponse.json({
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 900, // seconds (15 min)
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    res.cookies.set(cookie)
    if (user.role === 'admin') {
      res.cookies.set({ ...cookie, name: 'admin-token' })
    }

    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 })
  }
}
