import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAdminFromRequest } from '@/lib/auth'
import {
  deleteMediaFolder, countFilesInFolder, getMediaFolders,
  deleteKeepFile, renameMediaFolder,
} from '@/lib/media'

export async function PATCH(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const folders = await getMediaFolders()
  const folder = folders.find((f) => f.id === id)
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const count = await countFilesInFolder(folder.path)
  if (count > 0) {
    return NextResponse.json(
      { error: `Folder has ${count} file${count !== 1 ? 's' : ''}. Remove files before renaming.` },
      { status: 409 }
    )
  }

  try {
    const { folder: updated, oldPath, newPath } = await renameMediaFolder(id, name.trim())

    if (oldPath !== newPath) {
      await put(`${newPath}/.keep`, new Uint8Array(0), {
        access: 'public',
        contentType: 'text/plain',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
      await deleteKeepFile(oldPath)
    }

    return NextResponse.json({ folder: updated })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}

export async function DELETE(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const folders = await getMediaFolders()
  const folder = folders.find((f) => f.id === id)
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const folderPath = folder.path || `arshanemi-media/${folder.slug}`

  const count = await countFilesInFolder(folderPath)
  if (count > 0) {
    return NextResponse.json(
      { error: `Folder has ${count} file${count !== 1 ? 's' : ''}. Delete all files first.`, count },
      { status: 409 }
    )
  }

  await deleteKeepFile(folderPath)
  await deleteMediaFolder(id)
  return NextResponse.json({ ok: true })
}
