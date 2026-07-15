import { NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'
import { getAllUsers, getAllWalletTopups } from '@/lib/db'

// Admin-facing wallet_topups reads — same company-scoping rule as usage-history.
export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const userIdParam = searchParams.get('userId')
  const status = searchParams.get('status') || undefined
  const limit = Number(searchParams.get('limit')) || 500

  let userIds
  if (staff.role === 'admin') {
    const companyUsers = await getAllUsers({ companyId: staff.companyId })
    const allowedIds = new Set(companyUsers.map((u) => u.id))
    if (userIdParam) {
      if (!allowedIds.has(userIdParam)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      userIds = [userIdParam]
    } else {
      userIds = Array.from(allowedIds)
    }
  } else if (userIdParam) {
    userIds = [userIdParam]
  }

  const topups = await getAllWalletTopups({ userIds, status, limit })
  return NextResponse.json(topups)
}
