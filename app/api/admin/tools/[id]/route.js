import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getItem, updateItem, deleteItem } from '@/lib/db'

export async function GET(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tool = await getItem('tools', params.id)
  if (!tool) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tool)
}

export async function PUT(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  const updated = await updateItem('tools', params.id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await deleteItem('tools', params.id)
  return NextResponse.json({ ok: true })
}
