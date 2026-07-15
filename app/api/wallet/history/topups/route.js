import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getWalletTopupsForUser } from '@/lib/db'

// Own wallet_topups — powers Profile → Wallet tab.
export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 100
  const history = await getWalletTopupsForUser(payload.userId, { limit })
  return NextResponse.json(history)
}
