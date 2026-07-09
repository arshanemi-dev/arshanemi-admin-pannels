import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { listMedia, uploadMedia } from '@/lib/media'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // prefix = full blob path prefix, e.g. "arshanemi-images/partners" or "" for all
  const prefix = searchParams.get('prefix') || ''

  const blobs = await listMedia(prefix)
  return NextResponse.json({ blobs })
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const folder = formData.get('folder') || 'general'
  const files = formData.getAll('files')

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const MAX_MB = 10
  for (const file of files) {
    if (typeof file === 'string') continue
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds ${MAX_MB}MB limit` },
        { status: 400 }
      )
    }
  }

  const uploaded = await Promise.all(
    files
      .filter((f) => typeof f !== 'string')
      .map((f) => uploadMedia(f, folder))
  )

  return NextResponse.json({ uploaded })
}
