import { NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'
import { getAllUsers, getAllUsageHistory, getUsageHistoryGroupedByFeature } from '@/lib/db'

// Admin-facing tools_usage_history reads. Scoping follows the same pattern as
// app/api/admin/users/route.js: a company-scoped 'admin' only ever sees their
// own company's users' rows; 'master_admin' sees everything. companyId is
// never accepted from the client — always staff.companyId off the verified JWT.
export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const userIdParam = searchParams.get('userId')
  const toolSlug = searchParams.get('toolSlug') || undefined
  const groupBy = searchParams.get('groupBy')
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined
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

  if (groupBy === 'feature') {
    const grouped = await getUsageHistoryGroupedByFeature({ userIds, from, to })
    return NextResponse.json(grouped)
  }

  const history = await getAllUsageHistory({ userIds, toolSlug, limit })
  return NextResponse.json(history)
}
