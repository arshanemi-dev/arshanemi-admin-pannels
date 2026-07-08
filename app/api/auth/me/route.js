import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getUserById, getCompanyById } from '@/lib/db'

// Current user's own profile — any authenticated role (master_admin, admin, user).
export async function GET(req) {
  const payload = await getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserById(payload.userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const company = user.company_id ? await getCompanyById(user.company_id) : null

  const res = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    isActive: user.is_active,
    otpEnabled: user.otp_enabled,
    companyId: user.company_id,
    companyName: company?.name || company?.email || null,
    createdAt: user.created_at,
  })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
