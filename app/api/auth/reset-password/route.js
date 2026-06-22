import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth'
import { getUserByEmail, getUserByMobile, updateUserPassword } from '@/lib/db'

function validatePassword(pw) {
  if (!pw || pw.length < 8)       return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(pw))          return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(pw))          return 'Password must contain at least one number'
  if (!/[^A-Za-z0-9]/.test(pw))   return 'Password must contain at least one special character'
  return null
}

export async function POST(req) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }

  const pwError = validatePassword(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  try {
    const payload = await verifyToken(token)
    if (!payload || payload.purpose !== 'reset_password') {
      return NextResponse.json({ error: 'Invalid or expired reset token. Please start over.' }, { status: 400 })
    }

    const identifier = payload.identifier
    const isEmail = identifier.includes('@')
    const user = isEmail
      ? await getUserByEmail(identifier)
      : await getUserByMobile(identifier)

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const newHash = await bcrypt.hash(password, 10)
    await updateUserPassword(user.id, newHash)

    return NextResponse.json({ ok: true, message: 'Password reset successfully' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Could not reset password. Please try again.' }, { status: 500 })
  }
}
