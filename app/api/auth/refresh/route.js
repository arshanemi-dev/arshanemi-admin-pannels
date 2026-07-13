import { NextResponse } from 'next/server'
import { verifyRefreshToken, signToken, makeAuthCookie } from '@/lib/auth'

export async function POST(req) {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    const tokenPayload = {
      userId: payload.userId,
      role:   payload.role,
      // re-use fields that were in original token
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.name  ? { name:  payload.name  } : {}),
      ...(payload.companyId !== undefined ? { companyId: payload.companyId } : {}),
    }

    const accessToken = await signToken(tokenPayload, '1d')
    const cookie      = makeAuthCookie(accessToken)

    const res = NextResponse.json({
      ok: true,
      accessToken,
      expiresIn: 86400,
    })

    res.cookies.set(cookie)
    if (payload.role === 'master_admin') {
      res.cookies.set({ ...cookie, name: 'admin-token' })
    }

    return res
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
