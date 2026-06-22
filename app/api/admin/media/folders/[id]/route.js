import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { deleteMediaFolder, countFilesInFolder, getMediaFolders, deleteKeepFile } from '@/lib/media'

export async function DELETE(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const folders = await getMediaFolders()
  const folder = folders.find((f) => f.id === id)
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  // folder.path is full blob prefix e.g. "santhya-media/logos/brands"
  // Fall back for older records that don't have path stored
  const folderPath = folder.path || `santhya-media/${folder.slug}`

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
