import { NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'
import { getAllUserSettingsMap, upsertUserToolsAccess, getAllUsers } from '@/lib/db'

async function allowedUserIds(staff) {
  if (staff.role !== 'admin') return null // null = no restriction (master_admin)
  const companyUsers = await getAllUsers({ companyId: staff.companyId, role: 'user' })
  return new Set(companyUsers.map((u) => u.id))
}

export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const map = await getAllUserSettingsMap()
  const allowed = await allowedUserIds(staff)
  if (!allowed) return NextResponse.json(map)

  const scoped = {}
  for (const [userId, access] of Object.entries(map)) {
    if (allowed.has(userId)) scoped[userId] = access
  }
  return NextResponse.json(scoped)
}

// Bulk save — body is { [userId]: toolSlug[] }; each entry upserts one user_settings row.
export async function PUT(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await req.json()
  const allowed = await allowedUserIds(staff)
  const entries = Object.entries(access).filter(([userId]) => !allowed || allowed.has(userId))

  await Promise.all(entries.map(([userId, toolsAccess]) => upsertUserToolsAccess(userId, toolsAccess)))
  return NextResponse.json(Object.fromEntries(entries))
}
