import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getAllFilesExpiry, insertManyFilesExpiry } from '@/lib/db'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await getAllFilesExpiry()
  return NextResponse.json({ records })
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const items = body.items
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 })
  }
  for (const item of items) {
    if (!item.name || !item.expiryAt) {
      return NextResponse.json({ error: 'Each item needs name and expiryAt' }, { status: 400 })
    }
  }

  const inserted = await insertManyFilesExpiry(items)
  return NextResponse.json({ inserted }, { status: 201 })
}
