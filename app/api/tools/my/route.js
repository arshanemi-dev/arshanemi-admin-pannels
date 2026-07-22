import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getFeatureActivations } from '@/lib/db'
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

  const activations = await getFeatureActivations(payload.userId, tools.map((t) => t.slug))
  const enriched = tools.map((t) => ({
    ...t,
    features: (t.features || []).map((f) => {
      const activation = activations.get(`${t.slug}::${f.apiIdentifier}`)
      return {
        ...f,
        fixFeeCoins: f.fixFeeCoins ?? 0,
        activationActive: !f.fixFeeCoins || !!activation?.isActive,
        nextRenewalAt: activation?.nextRenewalAt ?? null,
      }
    }),
  }))

  return NextResponse.json(enriched, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
