import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(req) {
  const payload = await getAdminFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ username: payload.username })
}
