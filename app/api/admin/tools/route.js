import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { getAdminFromRequest } from '@/lib/auth'
import { getCollection, createItem } from '@/lib/db'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tools = await getCollection('tools')
  return NextResponse.json(tools)
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  const tool = await createItem('tools', data)
  revalidateTag('tools')
  revalidatePath('/', 'layout')
  revalidatePath('/tools')
  return NextResponse.json(tool, { status: 201 })
}
