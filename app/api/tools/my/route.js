import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getUserSettings } from '@/lib/db'
import { getAllTools } from '@/lib/tools'
import { defaultToolsAccessByRole } from '@/data/tools'

// Any authenticated user (not admin-only) — returns only the tools this user
// has been granted, per user_settings.tools_access (see Admin → Settings).
export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [settings, allTools] = await Promise.all([
    getUserSettings(payload.userId),
    getAllTools(),
  ])

  const access = settings?.tools_access ?? defaultToolsAccessByRole[payload.role] ?? defaultToolsAccessByRole.user
  const tools = allTools.filter((t) => access.includes(t.slug))

  return NextResponse.json(tools, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
