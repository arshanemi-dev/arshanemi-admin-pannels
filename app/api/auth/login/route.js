import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, signRefreshToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile, createOTP, verifyOTP } from '@/lib/db'
import { sendLoginOtpEmail } from '@/lib/mailer'

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req) {
  const { identifier, password, username, otpCode } = await req.json()

  // Support legacy admin login (username field) for backward compatibility
  const id = identifier || username

  if (!id || (!password && !otpCode)) {
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

    // OTP-gated login: always required for master_admin, optional per-user otherwise
    const otpRequired = user.role === 'master_admin' || !!user.otp_enabled

    if (otpCode) {
      // Step 2: verifying the login OTP
      if (!otpRequired) {
        return NextResponse.json({ error: 'OTP not applicable for this account' }, { status: 400 })
      }
      const valid = await verifyOTP({ identifier: user.email, otpCode, purpose: 'login_otp' })
      if (!valid) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
      }
    } else {
      // Step 1: password check
      const match = await bcrypt.compare(password, user.password_hash)
      if (!match) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      if (otpRequired) {
        if (!user.email) {
          return NextResponse.json({ error: 'Account has no email on file for OTP' }, { status: 500 })
        }
        const otp = generateOTP()
        await createOTP({ identifier: user.email, type: 'email', otpCode: otp, purpose: 'login_otp' })
        await sendLoginOtpEmail({ to: user.email, otpCode: otp, name: user.name })
        return NextResponse.json({ otpRequired: true, identifier: user.email })
      }
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role, name: user.name, companyId: user.company_id ?? null }

    // Access token (1 day) + long-lived refresh token (7 days). Refresh token
    // carries the same identity fields so a silent refresh doesn't drop
    // email/name/companyId from the re-signed access token.
    const accessToken  = await signToken(tokenPayload, '1d')
    const refreshToken = await signRefreshToken(tokenPayload)

    const cookie = makeAuthCookie(accessToken)

    const res = NextResponse.json({
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 86400, // seconds (1 day)
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    res.cookies.set(cookie)
    if (user.role === 'master_admin') {
      res.cookies.set({ ...cookie, name: 'admin-token' })
    }

    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 })
  }
}
