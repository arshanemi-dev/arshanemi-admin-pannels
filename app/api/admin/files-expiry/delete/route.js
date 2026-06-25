import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { deleteManyFilesExpiry } from '@/lib/db'

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  await deleteManyFilesExpiry(ids)
  return NextResponse.json({ ok: true })
}
