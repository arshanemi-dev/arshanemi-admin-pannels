import { list, put, del } from '@vercel/blob'

const MEDIA_PREFIX = 'santhya-media'
const FOLDERS_KEY = 'media-folders'

// ─── Blob helpers ──────────────────────────────────────────────────────────────

function blobBaseUrl() {
  const raw = process.env.BLOB_STORE_ID || ''
  const id = raw.replace(/^store_/i, '').toLowerCase()
  return `https://${id}.public.blob.vercel-storage.com`
}

async function readFoldersBlob() {
  const url = `${blobBaseUrl()}/santhya-data/${FOLDERS_KEY}.json?t=${Date.now()}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeFoldersBlob(folders) {
  await put(`santhya-data/${FOLDERS_KEY}.json`, JSON.stringify(folders, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

// ─── File listing ──────────────────────────────────────────────────────────────

// prefix = '' → all blobs except santhya-data
// prefix = 'santhya-images/partners' → just that folder
export async function listMedia(prefix = '') {
  const opts = prefix
    ? { prefix: prefix.endsWith('/') ? prefix : `${prefix}/`, limit: 1000 }
    : { limit: 1000 }
  const result = await list(opts)
  return result.blobs
    .filter((b) => !b.pathname.startsWith('santhya-data/'))
    .map((b) => ({
      url: b.url,
      pathname: b.pathname,
      filename: b.pathname.split('/').pop(),
      folder: b.pathname.split('/').slice(0, -1).join('/'),
      size: b.size,
      uploadedAt: b.uploadedAt,
      contentType: b.contentType || guessContentType(b.pathname),
      // .keep files are invisible placeholders that make empty folders visible in blob list
      isPlaceholder: b.pathname.endsWith('/.keep'),
    }))
}

// Build sidebar folder tree from a flat blob list (runs client-side)
export function buildFolderTree(blobs) {
  const map = new Map()
  for (const b of blobs) {
    const folder = b.folder
    if (!folder) continue
    if (!map.has(folder)) {
      const parts = folder.split('/')
      map.set(folder, {
        path: folder,                                    // "santhya-images/partners"
        bucket: parts[0],                               // "santhya-images"
        displayName: parts.slice(1).join('/') || parts[0], // "partners"
        count: 0,
      })
    }
    map.get(folder).count++
  }
  return [...map.values()].sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket.localeCompare(b.bucket)
    return a.displayName.localeCompare(b.displayName)
  })
}

function guessContentType(pathname) {
  const ext = pathname.split('.').pop().toLowerCase()
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    pdf: 'application/pdf',
  }
  return map[ext] || 'application/octet-stream'
}

// ─── File upload ───────────────────────────────────────────────────────────────

export async function uploadMedia(file, folder = 'general') {
  const { nanoid } = await import('nanoid')
  const ext = file.name.split('.').pop().toLowerCase()
  const pathname = `${MEDIA_PREFIX}/${folder}/${nanoid()}.${ext}`
  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
    addRandomSuffix: false,
  })
  return {
    url: blob.url,
    pathname: blob.pathname,
    filename: file.name,
    folder,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    contentType: file.type,
  }
}

// ─── File delete ───────────────────────────────────────────────────────────────

export async function deleteMediaFiles(urls) {
  const validUrls = urls.filter((u) => u && u.includes('blob.vercel-storage.com'))
  if (validUrls.length === 0) return
  await del(validUrls)
}

// ─── Folder CRUD ───────────────────────────────────────────────────────────────

export async function getMediaFolders() {
  return readFoldersBlob()
}

// parentPath = full blob path of parent, e.g. "santhya-media" or "santhya-media/logos"
export async function createMediaFolder(name, parentPath = 'santhya-media') {
  const { nanoid } = await import('nanoid')
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  const path = `${parentPath}/${slug}`
  const folders = await readFoldersBlob()
  if (folders.some((f) => f.path === path)) {
    throw new Error(`Folder "${path}" already exists`)
  }
  const folder = { id: nanoid(), name, slug, path, createdAt: new Date().toISOString() }
  folders.push(folder)
  await writeFoldersBlob(folders)
  return folder
}

export async function deleteMediaFolder(id) {
  const folders = await readFoldersBlob()
  const updated = folders.filter((f) => f.id !== id)
  await writeFoldersBlob(updated)
}

// ─── Count files in a folder ───────────────────────────────────────────────────

export async function countFilesInFolder(folderPath) {
  // folderPath is the full blob prefix, e.g. "santhya-media/logos"
  const blobs = await listMedia(folderPath)
  // exclude .keep placeholder — an "empty" folder has only the placeholder
  return blobs.filter((b) => !b.isPlaceholder).length
}

// Delete the .keep placeholder blob for a given full folder path, e.g. "santhya-media/logos"
export async function deleteKeepFile(folderPath) {
  const keepUrl = `${blobBaseUrl()}/${folderPath}/.keep`
  try {
    await del(keepUrl)
  } catch {
    // ignore — blob may already be gone
  }
}
