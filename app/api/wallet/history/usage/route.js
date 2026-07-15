import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getUsageHistoryForUser } from '@/lib/db'

// Own tools_usage_history — powers Profile → Coin Use tab.
export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 100
  const history = await getUsageHistoryForUser(payload.userId, { limit })
  return NextResponse.json(history)
}
