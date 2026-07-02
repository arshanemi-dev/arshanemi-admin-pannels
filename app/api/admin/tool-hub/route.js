import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getCollection, createItem } from '@/lib/db'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await getCollection('toolHub')
  return NextResponse.json(items)
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  const item = await createItem('toolHub', data)
  return NextResponse.json(item, { status: 201 })
}
