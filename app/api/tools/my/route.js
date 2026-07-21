import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getPaidFeatureFeeKeys } from '@/lib/db'
import { getAllTools, getUserToolsAccess } from '@/lib/tools'

// Any authenticated user (not admin-only) — returns only the tools this user
// has been granted, per user_settings.tools_access (see Admin → Settings).
export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [access, allTools] = await Promise.all([
    getUserToolsAccess(payload.userId, payload.role),
    getAllTools(),
  ])

  const tools = allTools.filter((t) => access.includes(t.slug))

  const paidKeys = await getPaidFeatureFeeKeys(payload.userId, tools.map((t) => t.slug))
  const enriched = tools.map((t) => ({
    ...t,
    features: (t.features || []).map((f) => ({
      ...f,
      fixFeePaise: f.fixFeePaise ?? 0,
      feePaid: !f.fixFeePaise || paidKeys.has(`${t.slug}::${f.apiIdentifier}`),
    })),
  }))

  return NextResponse.json(enriched, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
