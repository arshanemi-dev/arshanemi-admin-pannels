import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getStaffFromRequest } from '@/lib/auth'
import { getAllUsers, getUserByEmail, getUserByMobile, getCompanyById, createUser, createUserSettings } from '@/lib/db'
import { validatePassword } from '@/lib/validation'

export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Company-scoped admins only ever manage plain 'user' accounts in their own
  // company, never fellow admins — master_admin still sees every role.
  const users = staff.role === 'admin'
    ? await getAllUsers({ companyId: staff.companyId, role: 'user' })
    : await getAllUsers()

  return NextResponse.json(users)
}

export async function POST(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let { name, email, mobile, password, role, companyId, otpEnabled, address1, address2, walletCreditsTotal } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email && !mobile) return NextResponse.json({ error: 'Provide at least an email or mobile number' }, { status: 400 })

  const pwError = validatePassword(password)
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

  // Company-scoped admins can only create plain users inside their own company —
  // role/companyId from the request body are never trusted for this role.
  if (staff.role === 'admin') {
    role = 'user'
    companyId = staff.companyId
    if (!companyId) return NextResponse.json({ error: 'Your account has no company on file' }, { status: 400 })
  } else {
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 })
    }
    if (!companyId) {
      return NextResponse.json({ error: 'Please create a company first, then assign it here' }, { status: 400 })
    }
    const company = await getCompanyById(companyId)
    if (!company) return NextResponse.json({ error: 'Selected company does not exist' }, { status: 400 })
  }

  try {
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
      role,
      companyId,
      otpEnabled: !!otpEnabled,
      address1: address1?.trim() || null,
      address2: address2?.trim() || null,
      walletCreditsTotal: Number.isFinite(+walletCreditsTotal) ? Math.max(0, +walletCreditsTotal) : 0,
    })

    try {
      await createUserSettings(user.id, user.role)
    } catch (err) {
      console.error('Failed to create default user_settings:', err)
    }

    return NextResponse.json({
      id: user.id, name: user.name, email: user.email, mobile: user.mobile,
      role: user.role, companyId: user.company_id, isActive: user.is_active,
      otpEnabled: user.otp_enabled, address1: user.address1, address2: user.address2,
      walletCreditsTotal: user.wallet_credits_total, walletCreditsUsed: user.wallet_credits_used,
      createdAt: user.created_at,
    }, { status: 201 })
  } catch (err) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: err.message || 'Could not create user' }, { status: 500 })
  }
}
