import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAdminFromRequest } from '@/lib/auth'
import { getMediaFolders, createMediaFolder } from '@/lib/media'

export async function GET(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folders = await getMediaFolders()
  return NextResponse.json({ folders })
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, parentPath = 'arshanemi-media' } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
  }

  try {
    const folder = await createMediaFolder(name.trim(), parentPath)

    // 0-byte .keep makes the folder visible in Vercel Blob list() immediately.
    // allowOverwrite: true avoids an error if the same path already exists.
    await put(`${folder.path}/.keep`, new Uint8Array(0), {
      access: 'public',
      contentType: 'text/plain',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return NextResponse.json({ folder })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
