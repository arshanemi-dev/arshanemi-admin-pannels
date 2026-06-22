import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail, getUserByMobile, createUser } from '@/lib/db'

function validatePassword(pw) {
  if (!pw || pw.length < 8)       return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(pw))          return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(pw))          return 'Password must contain at least one number'
  if (!/[^A-Za-z0-9]/.test(pw))   return 'Password must contain at least one special character'
  return null
}

export async function POST(req) {
  const { name, email, mobile, password, confirm } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email && !mobile) return NextResponse.json({ error: 'Provide at least an email or mobile number' }, { status: 400 })
  if (password !== confirm) return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })

  const pwError = validatePassword(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  try {
    // Check duplicates
    if (email) {
      const existing = await getUserByEmail(email.toLowerCase().trim())
      if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    if (mobile) {
      const existing = await getUserByMobile(mobile.trim())
      if (existing) return NextResponse.json({ error: 'An account with this mobile number already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      mobile: mobile ? mobile.trim() : null,
      passwordHash,
      role: 'user',
    })

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, name: user.name })
    const cookie = makeAuthCookie(token)
    const res = NextResponse.json({ ok: true, role: user.role, name: user.name }, { status: 201 })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
  }
}
