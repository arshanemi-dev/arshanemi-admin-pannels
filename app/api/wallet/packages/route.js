import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'
import { getAllCoinPackages } from '@/lib/db'

// Any authenticated role — active coin packages shown on /settings/plan.
export async function GET(req) {
  const payload = await getAuthPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const packages = await getAllCoinPackages({ activeOnly: true })
  return NextResponse.json(packages)
}
