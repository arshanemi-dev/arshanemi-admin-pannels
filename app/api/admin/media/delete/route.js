import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { deleteMediaFiles } from '@/lib/media'

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { urls } = await req.json()
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
  }

  await deleteMediaFiles(urls)
  return NextResponse.json({ deleted: urls.length })
}
