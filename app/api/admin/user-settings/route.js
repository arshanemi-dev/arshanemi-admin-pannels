import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getAllUserSettingsMap, upsertUserToolsAccess } from '@/lib/db'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const map = await getAllUserSettingsMap()
  return NextResponse.json(map)
}

// Bulk save — body is { [userId]: toolSlug[] }; each entry upserts one user_settings row.
export async function PUT(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await req.json()
  await Promise.all(
    Object.entries(access).map(([userId, toolsAccess]) => upsertUserToolsAccess(userId, toolsAccess))
  )
  return NextResponse.json(access)
}
