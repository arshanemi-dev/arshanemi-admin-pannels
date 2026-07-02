import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { getAdminFromRequest } from '@/lib/auth'
import { getItem, updateItem, deleteItem } from '@/lib/db'

function revalidatePublicPages(item) {
  revalidatePath('/', 'layout')
  revalidatePath('/tools')
  if (item?.slug) {
    revalidatePath(`/tools/${item.slug}`)
    revalidatePath(`/tools/${item.slug}/use`)
  }
}

export async function GET(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const tool = await getItem('tools', id)
  if (!tool) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tool)
}

export async function PUT(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const updated = await updateItem('tools', id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidateTag('tools')
  revalidatePublicPages(updated)
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await getItem('tools', id)
  await deleteItem('tools', id)
  revalidateTag('tools')
  revalidatePublicPages(item)
  return NextResponse.json({ ok: true })
}
