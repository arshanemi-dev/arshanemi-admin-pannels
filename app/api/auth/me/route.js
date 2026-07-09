import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getUserById, getCompanyById, getUserByEmail, getUserByMobile, updateUser } from '@/lib/db'

function serializeProfile(user, company) {
  const total = user.wallet_credits_total ?? 0
  const used = user.wallet_credits_used ?? 0
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    address1: user.address1,
    address2: user.address2,
    role: user.role,
    isActive: user.is_active,
    otpEnabled: user.otp_enabled,
    companyId: user.company_id,
    companyName: company?.name || company?.email || null,
    walletCreditsTotal: total,
    walletCreditsUsed: used,
    walletCreditsRemaining: Math.max(0, total - used),
    createdAt: user.created_at,
  }
}

// Current user's own profile — any authenticated role (master_admin, admin, user).
export async function GET(req) {
  const payload = await getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserById(payload.userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const company = user.company_id ? await getCompanyById(user.company_id) : null

  const res = NextResponse.json(serializeProfile(user, company))
  res.headers.set('Cache-Control', 'no-store')
  return res
}

// Self-service profile edit — name/email/mobile/address only. Role, company,
// active status, OTP requirement and wallet credits stay admin-managed
// (Admin → Users), never editable by the account owner.
export async function PATCH(req) {
  const payload = await getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patch = {}

  if ('name' in body) {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    patch.name = body.name.trim()
  }
  if ('address1' in body) patch.address1 = body.address1
  if ('address2' in body) patch.address2 = body.address2

  if ('email' in body) {
    const email = body.email ? body.email.toLowerCase().trim() : null
    if (email) {
      const existing = await getUserByEmail(email)
      if (existing && existing.id !== payload.userId) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
      }
    }
    patch.email = email
  }
  if ('mobile' in body) {
    const mobile = body.mobile ? body.mobile.trim() : null
    if (mobile) {
      const existing = await getUserByMobile(mobile)
      if (existing && existing.id !== payload.userId) {
        return NextResponse.json({ error: 'An account with this mobile number already exists' }, { status: 409 })
      }
    }
    patch.mobile = mobile
  }

  try {
    const updated = await updateUser(payload.userId, patch)
    const company = updated.company_id ? await getCompanyById(updated.company_id) : null
    return NextResponse.json(serializeProfile(updated, company))
  } catch (err) {
    console.error('Self-edit profile error:', err)
    return NextResponse.json({ error: err.message || 'Could not update profile' }, { status: 500 })
  }
}
