# MultiImageLink Generator — File Management Tool
## Plan: tools/arshanemi-tools-1 (Standalone Next.js App, port 3001)

---

## Context

A standalone file manager and image URL grouping tool. It lives entirely inside `tools/arshanemi-tools-1/` — its own Next.js app, own Tailwind config, own package.json. Nothing shared with the parent project.

**Storage backend: Dropbox** — all file operations (list, upload, delete, move, copy, create folder) go through the Dropbox API via the official `dropbox` SDK. Shared links from Dropbox are used as the public URLs passed into the grouping wizard.

Two data modes (Task 3):
- **DB mode** — if `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are present in `.env.local` → fetch folder/file metadata from Supabase
- **Fallback mode** — if not set → use static records in `data/stored.js`

No site-specific folder names. Fully generic tool.

---

## Tech Stack

- Next.js 16 (App Router), JavaScript only (`.jsx` / `.js`)
- Tailwind CSS v4 — tokens in `app/globals.css` via `@theme {}`
- Framer Motion — modal animations
- Lucide React — icons
- **`dropbox`** — official Dropbox SDK (server-side only, in API routes + lib/storage.js)
- `@supabase/supabase-js` — DB mode only (conditional import)
- `nanoid` — unique IDs
- `clsx` + `tailwind-merge` — class merging

---

## Dropbox Auth Strategy

Use a **long-lived offline access token** generated from the Dropbox App Console:
- App type: **Scoped access**, permissions: `files.content.read`, `files.content.write`, `sharing.write`
- Generate token once → store as `DROPBOX_ACCESS_TOKEN` in `.env.local`
- All server-side API calls instantiate: `new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })`
- The SDK and token **never reach the browser** — only called inside `/api/*` route handlers

For shared link URLs (used in CopyUrlsModal):
- `sharingCreateSharedLinkWithSettings({ path, settings: { requested_visibility: 'public' } })`
- Replace `?dl=0` → `?raw=1` in the URL to get a direct CDN link usable in `<img src>`

For thumbnails inside the file manager:
- Route `/api/thumbnail?path=...` → calls `filesGetThumbnailV2` → streams image bytes back
- This avoids CORS issues and keeps the token server-side

---

## Project Layout

```
tools/arshanemi-tools-1/
├── package.json                   ← own deps
├── next.config.mjs                ← port 3001, image remotePatterns for Dropbox CDN
├── jsconfig.json                  ← "@/*": ["./*"]
├── postcss.config.mjs
├── .env.local                     ← DROPBOX_ACCESS_TOKEN + optional Supabase keys
├── .env.example
│
├── app/
│   ├── globals.css                ← @theme {} dark tokens
│   ├── layout.js                  ← Inter font, Header, ToastProvider
│   ├── page.js                    ← redirect → /files
│   ├── files/
│   │   ├── page.js                ← root folder explorer
│   │   └── [...path]/
│   │       └── page.js            ← nested path explorer
│   └── api/
│       ├── files/
│       │   └── route.js           ← GET list; POST create-folder/paste; DELETE; PATCH rename/move
│       ├── upload/
│       │   └── route.js           ← POST multipart → Dropbox filesUpload
│       ├── thumbnail/
│       │   └── route.js           ← GET ?path=... → proxy Dropbox thumbnail bytes
│       └── urls/
│           └── route.js           ← POST {items,groupSize,sortBy} → grouped URLs + TSV
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── ToastProvider.jsx
│   ├── files/
│   │   ├── FileExplorer.jsx       ← main stateful container
│   │   ├── Toolbar.jsx            ← Select All | New Folder | Upload | view toggle | sort
│   │   ├── Breadcrumb.jsx         ← clickable path segments
│   │   ├── FileGrid.jsx           ← thumbnail grid view
│   │   ├── FileList.jsx           ← table/list view
│   │   ├── FileItem.jsx           ← single item (shared by grid + list)
│   │   ├── SelectionBar.jsx       ← count badge + Copy | Cut | Paste | Rename | Delete | Copy URLs
│   │   ├── ContextMenu.jsx        ← right-click menu
│   │   ├── DropZone.jsx           ← drag-and-drop upload overlay
│   │   ├── CreateFolderModal.jsx
│   │   ├── RenameModal.jsx
│   │   ├── DeleteConfirmModal.jsx
│   │   ├── UploadModal.jsx        ← file picker + per-file progress
│   │   └── CopyUrlsModal.jsx      ← grouping wizard (Task 2)
│   └── ui/
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Badge.jsx
│       └── Spinner.jsx
│
├── context/
│   └── FileManagerContext.jsx     ← currentPath, selection, clipboard, view, sort, toast
│
├── hooks/
│   ├── useFiles.js                ← fetch file list for current path
│   ├── useSelection.js            ← click / shift-click / ctrl-click / select-all
│   ├── useClipboard.js            ← copy / cut / paste state + API calls
│   ├── useContextMenu.js          ← right-click position + open/close
│   └── useUpload.js               ← multipart POST with per-file progress tracking
│
├── lib/
│   ├── storage.js                 ← Dropbox SDK wrappers (server-only)
│   ├── db.js                      ← data-source selector (Supabase DB vs data/stored.js)
│   ├── groupLinks.js              ← groupLinks(), sortUrls(), toExcelTSV(), toJSON()
│   └── utils.js                   ← cn(), formatBytes(), getFileType(), isImage()
│
└── data/
    └── stored.js                  ← fallback folder/file records (no DB connected)
```

---

## Phase 1 — Bootstrap

Write manually (no interactive CLI):

**`package.json`**
```json
{
  "name": "arshanemi-tools-1",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "dropbox": "^10.34.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^1.0.0",
    "nanoid": "^5.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

**`next.config.mjs`**
```js
export default {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dl.dropboxusercontent.com' },
      { protocol: 'https', hostname: 'www.dropbox.com' },
    ]
  }
}
```

---

## Phase 2 — Storage Layer (lib/storage.js)

All Dropbox operations. **Server-side only** — never imported in client components.

```js
import { Dropbox } from 'dropbox'

function getDbx() {
  return new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })
}

// List folder contents → { folders: [], files: [] }
// path: '' for root, '/folder-name' for subfolder
export async function listFolder(path) {
  const dbx = getDbx()
  const res = await dbx.filesListFolder({ path: path || '' })
  const folders = res.result.entries.filter(e => e['.tag'] === 'folder').map(normalizeFolder)
  const files   = res.result.entries.filter(e => e['.tag'] === 'file').map(normalizeFile)
  return { folders, files }
}

// Upload a file (Buffer or ReadableStream)
// Returns { name, path, url, size }
export async function uploadFile(folderPath, filename, buffer) {
  const dbx = getDbx()
  const path = `${folderPath}/${filename}`.replace(/\/\//g, '/')
  const res = await dbx.filesUpload({ path, contents: buffer, mode: 'add', autorename: true })
  const url = await getSharedLink(res.result.path_display)
  return normalizeFile({ ...res.result, url })
}

// Delete one or more Dropbox paths
export async function deleteItems(paths) {
  const dbx = getDbx()
  await Promise.all(paths.map(p => dbx.filesDeleteV2({ path: p })))
}

// Rename or move a file/folder
export async function moveItem(fromPath, toPath) {
  const dbx = getDbx()
  await dbx.filesMoveV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

// Copy a file to a new destination
export async function copyItem(fromPath, toPath) {
  const dbx = getDbx()
  await dbx.filesCopyV2({ from_path: fromPath, to_path: toPath, autorename: true })
}

// Create a folder
export async function createFolder(path) {
  const dbx = getDbx()
  await dbx.filesCreateFolderV2({ path, autorename: true })
}

// Get or create a public shared link; return direct CDN URL (raw=1)
export async function getSharedLink(path) {
  const dbx = getDbx()
  try {
    const res = await dbx.sharingCreateSharedLinkWithSettings({ path })
    return res.result.url.replace('dl=0', 'raw=1').replace('?dl=0', '?raw=1')
  } catch (e) {
    if (e?.error?.error?.['.tag'] === 'shared_link_already_exists') {
      const existing = await dbx.sharingListSharedLinks({ path, direct_only: true })
      return existing.result.links[0].url.replace('dl=0', 'raw=1')
    }
    throw e
  }
}

// Proxy thumbnail: returns ArrayBuffer of image bytes
export async function getThumbnail(path) {
  const dbx = getDbx()
  const res = await dbx.filesGetThumbnailV2({
    resource: { '.tag': 'path', path },
    format: { '.tag': 'jpeg' },
    size: { '.tag': 'w256h256' }
  })
  return res.result.fileBinary
}

function normalizeFolder(e) {
  return { tag: 'folder', name: e.name, path: e.path_display, id: e.id }
}
function normalizeFile(e) {
  return {
    tag: 'file', name: e.name, path: e.path_display, id: e.id,
    size: e.size, modified: e.server_modified, url: e.url ?? null
  }
}
```

---

## Phase 3 — Data Layer (Task 3)

### lib/db.js

```js
// DB mode: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY both present
// Fallback: data/stored.js

export async function getAllFolderMeta() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data } = await supabase.from('file_manager_folders').select('*')
    return data ?? []
  }
  const { stored } = await import('@/data/stored')
  return stored
}
```

### data/stored.js

```js
// Fallback when no DB configured — generic folder structure
export const stored = [
  { path: '/uploads',   label: 'Uploads',   tag: 'folder' },
  { path: '/images',    label: 'Images',    tag: 'folder' },
  { path: '/documents', label: 'Documents', tag: 'folder' },
  { path: '/exports',   label: 'Exports',   tag: 'folder' },
]
```

---

## Phase 4 — API Routes

### GET/POST/DELETE/PATCH /api/files

```
GET    ?path=/folder              → listFolder(path) → { folders, files }
POST   { action:'create-folder', path, name }   → createFolder(path + '/' + name)
POST   { action:'copy', paths[], destPath }      → copyItem() for each
POST   { action:'move', paths[], destPath }      → moveItem() for each
DELETE { paths: string[] }                       → deleteItems(paths)
PATCH  { path, newName }                         → moveItem(path, parentPath + '/' + newName)
```

### POST /api/upload

```
multipart/form-data: { files[], folderPath }
→ uploadFile(folderPath, file.name, buffer) for each
→ { uploaded: [{ name, path, url, size }] }
```
Uses `request.formData()` to extract files, reads each as `ArrayBuffer`.

### GET /api/thumbnail

```
GET ?path=/folder/image.jpg
→ getThumbnail(path) → Response with Content-Type: image/jpeg
```
Proxies Dropbox thumbnail bytes — keeps access token server-side, avoids CORS.

### POST /api/urls (Task 2 — link grouping)

```
POST { items: string[], groupSize: 2|3|4|5, sortBy: 'name-asc'|'name-desc'|'date'|'count' }
→ {
    groups: [['url1','url2'], ['url3','url4'], ...],
    tsv: "url1\turl2\nurl3\turl4",
    total: N,
    groupCount: M
  }
```
Items are Dropbox shared link URLs (CDN `raw=1` format). The route sorts and groups them server-side using `lib/groupLinks.js`.

---

## Phase 5 — Context & Hooks

### context/FileManagerContext.jsx

```js
{
  currentPath,   setCurrentPath,   // Dropbox path string e.g. '' or '/images'
  items,         setItems,          // { folders[], files[] } from API
  selectedItems,                    // Set<dropbox-path>
  toggleSelect,  selectAll,  clearSelection,
  clipboard,     setClipboard,     // { op: 'copy'|'cut', paths: [] }
  view,          setView,          // 'grid'|'list'
  sortBy,        setSortBy,        // 'name'|'date'|'size'|'type'
  loading,       error,
  refetch,
  toast,                           // fn(message, type)
}
```

### hooks/useSelection.js

- Single click → replace selection with that item
- Ctrl/Cmd + click → toggle
- Shift + click → range-select from last clicked
- Returns `{ selectedItems, toggleSelect, selectAll, clearSelection }`

### hooks/useFiles.js

- `GET /api/files?path={currentPath}` on mount + path change
- Returns `{ folders, files, loading, error, refetch }`

---

## Phase 6 — File Explorer Components (Task 1)

### FileExplorer.jsx (Client Component)

Renders: `<Breadcrumb>` → `<Toolbar>` → `<FileGrid>` or `<FileList>` → `<SelectionBar>`

Keyboard: `Escape` clear · `Ctrl+A` select-all · `Ctrl+C` copy · `Ctrl+X` cut · `Ctrl+V` paste · `F2` rename · `Delete` confirm-delete

### Toolbar.jsx (always visible)

```
[ Select All ]  [ + New Folder ]  [ ↑ Upload ]     |  [ ⊞ Grid / ☰ List ]  [ Sort ▾ ]
```

### SelectionBar.jsx (appears when ≥1 item selected)

```
[ 3 selected ]  [ Copy ]  [ Cut ]  [ Paste ]  [ Rename* ]  [ Delete ]  [ Copy URLs** ]
```

- `*` Rename: active only when exactly 1 selected
- `**` Copy URLs: active only when ≥1 file selected (not folders)
- Paste: active only when clipboard non-empty and we're in a different folder

### FileItem.jsx

- Selected: indigo border + indigo-tinted background
- Cut: 50% opacity
- Image files → `<img src="/api/thumbnail?path=...">` (proxied through our API)
- Non-image → Lucide icon by file type
- Folder → FolderOpen icon + item count if available
- Shows: name (truncated 20 chars), size or type badge

### ContextMenu.jsx (right-click, positioned at cursor)

Open · Rename · Copy · Cut · Paste · — · Copy URL(s) · — · Delete

---

## Phase 7 — CopyUrlsModal & Link Grouper (Task 2)

### CopyUrlsModal.jsx

Opens with the Dropbox shared links for all selected files already passed in.

**Controls:**
```
Group by:  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]    (pill selector, default 3)
Sort by:   [ Name ↑ ]  [ Name ↓ ]  [ Date ]  [ Count ]
```

**Live preview table:**
```
      Col 1        Col 2        Col 3
  1   img-a.jpg    img-b.jpg    img-c.jpg
  2   img-d.jpg    img-e.jpg    img-f.jpg
  3   img-g.jpg    img-h.jpg    —
```
Each cell: thumbnail (via `/api/thumbnail`) + filename. Row numbers left. Empty cells shown as `—`.

**Counter:** "9 images · 3 groups of 3"

**Action buttons:**
- **Copy for Excel** → TSV (`url1\turl2\nurl3\turl4\n…`) to clipboard
- **Copy as JSON** → `[["url1","url2"],["url3","url4"]]`
- **Copy plain list** → newline-separated URLs

### lib/groupLinks.js

```js
export function sortUrls(urls, sortBy) {
  const name  = u => u.split('/').pop().split('?')[0]
  const count = u => parseInt(name(u).match(/\d+/)?.[0] ?? '0', 10)
  if (sortBy === 'name-asc')  return [...urls].sort((a,b) => name(a).localeCompare(name(b)))
  if (sortBy === 'name-desc') return [...urls].sort((a,b) => name(b).localeCompare(name(a)))
  if (sortBy === 'count')     return [...urls].sort((a,b) => count(a) - count(b))
  return urls  // 'date' → leave in API order (Dropbox returns by modified date)
}

export function groupLinks(urls, groupSize) {
  const groups = []
  for (let i = 0; i < urls.length; i += groupSize)
    groups.push(urls.slice(i, i + groupSize))
  return groups
}

export function toExcelTSV(groups) {
  return groups.map(row => row.join('\t')).join('\n')
}

export function toJSON(groups) {
  return JSON.stringify(groups)
}
```

---

## Phase 8 — Upload Flow

### UploadModal.jsx

- Multi-select file picker + drag-and-drop in same modal
- Preview thumbnails (from local `URL.createObjectURL`) before upload
- Per-file progress bar using XHR `upload.onprogress`
- After all complete → refetch file list + close modal

### DropZone.jsx

- Invisible full-window overlay, activates on `dragover`
- Indigo dashed border highlights current folder drop target
- On drop → same upload flow

---

## Phase 9 — App Shell

### app/layout.js

```jsx
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/layout/ToastProvider'
const inter = Inter({ subsets: ['latin'] })
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Header />
          <main className="min-h-screen bg-[#0a0a0a]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
```

### app/files/page.js + app/files/[...path]/page.js

Both render `<FileExplorer path={params?.path ?? []} />`. The `[...path]` catches any nesting depth.

---

## .env.local (tools/arshanemi-tools-1/)

```
# Required — Dropbox long-lived offline access token
# Generate at: https://www.dropbox.com/developers/apps → your app → Generated access token
DROPBOX_ACCESS_TOKEN=

# Optional — if set, DB mode activates for folder metadata (Task 3)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

---

## File Delta Table

| # | Path | Purpose | Est. LOC |
|---|------|---------|---------|
| P1 | package.json | deps + scripts (port 3001) | 40 |
| P2 | next.config.mjs | Dropbox image domains | 12 |
| P3 | jsconfig.json | @/* alias | 8 |
| P4 | postcss.config.mjs | Tailwind v4 | 6 |
| P5 | .env.example | env docs | 12 |
| A1 | app/globals.css | @theme tokens | 70 |
| A2 | app/layout.js | root shell | 22 |
| A3 | app/page.js | redirect | 5 |
| A4 | app/files/page.js | root folder page | 15 |
| A5 | app/files/[...path]/page.js | nested path page | 18 |
| A6 | app/api/files/route.js | file CRUD (Dropbox) | 100 |
| A7 | app/api/upload/route.js | upload → Dropbox | 60 |
| A8 | app/api/thumbnail/route.js | proxy Dropbox thumbnail | 30 |
| A9 | app/api/urls/route.js | link grouping | 40 |
| C1 | components/layout/Header.jsx | app header | 35 |
| C2 | components/layout/ToastProvider.jsx | global toasts | 60 |
| C3 | components/files/FileExplorer.jsx | main container | 120 |
| C4 | components/files/Toolbar.jsx | top action bar | 80 |
| C5 | components/files/Breadcrumb.jsx | path nav | 50 |
| C6 | components/files/FileGrid.jsx | grid view | 60 |
| C7 | components/files/FileList.jsx | list view | 80 |
| C8 | components/files/FileItem.jsx | single item | 120 |
| C9 | components/files/SelectionBar.jsx | selection bar | 100 |
| C10 | components/files/ContextMenu.jsx | right-click | 80 |
| C11 | components/files/DropZone.jsx | drag-drop | 55 |
| C12 | components/files/CreateFolderModal.jsx | new folder | 55 |
| C13 | components/files/RenameModal.jsx | rename | 55 |
| C14 | components/files/DeleteConfirmModal.jsx | delete confirm | 50 |
| C15 | components/files/UploadModal.jsx | upload + progress | 120 |
| C16 | components/files/CopyUrlsModal.jsx | grouping wizard | 180 |
| C17 | components/ui/Button.jsx | button | 35 |
| C18 | components/ui/Modal.jsx | modal wrapper | 50 |
| C19 | components/ui/Badge.jsx | count badge | 18 |
| C20 | components/ui/Spinner.jsx | loading | 12 |
| X1 | context/FileManagerContext.jsx | global state | 100 |
| H1 | hooks/useFiles.js | file list | 55 |
| H2 | hooks/useSelection.js | multi-select | 75 |
| H3 | hooks/useClipboard.js | copy/cut/paste | 55 |
| H4 | hooks/useContextMenu.js | right-click pos | 35 |
| H5 | hooks/useUpload.js | upload + progress | 65 |
| L1 | lib/storage.js | Dropbox SDK wrappers | 140 |
| L2 | lib/db.js | DB vs data/ switch | 55 |
| L3 | lib/groupLinks.js | grouping + TSV | 70 |
| L4 | lib/utils.js | cn, formatBytes | 45 |
| D1 | data/stored.js | fallback folder data | 20 |

**~45 files · ~2,600 LOC**

---

## Implementation Order

1. Bootstrap — package.json, configs, .env.local, .env.example
2. `npm install` inside tools/arshanemi-tools-1
3. app/globals.css, lib/utils.js, ui/ primitives (Button, Modal, Badge, Spinner)
4. lib/storage.js (all Dropbox ops), lib/db.js, data/stored.js, lib/groupLinks.js
5. API routes — /api/files, /api/upload, /api/thumbnail, /api/urls
6. context/FileManagerContext.jsx + all 5 hooks
7. Core components — FileExplorer, Toolbar, Breadcrumb, FileGrid, FileList, FileItem, SelectionBar, ContextMenu
8. Modals — DropZone, CreateFolder, Rename, Delete, Upload, CopyUrls
9. App shell — layout.js, page.js, files pages, Header, ToastProvider
10. End-to-end test + npm run build

---

## Verification Checklist

- [ ] `npm run dev` starts on port 3001, zero errors
- [ ] DROPBOX_ACCESS_TOKEN set → `/files` shows Dropbox root folder contents
- [ ] No Supabase env → fallback folders from data/stored.js shown
- [ ] With Supabase env → folder metadata from DB
- [ ] Click folder → navigates in, breadcrumb updates with Dropbox path segments
- [ ] Upload images → appear in grid; thumbnails load via /api/thumbnail proxy
- [ ] Click → "1 selected"; Ctrl+click adds; Shift+click range; counter updates
- [ ] Select All → selects everything in current folder
- [ ] New Folder → Dropbox folder created, grid refreshes
- [ ] Rename → Dropbox `filesMoveV2` called, item name updates
- [ ] Copy + Paste → `filesCopyV2` called, file appears at destination
- [ ] Cut + Paste → `filesMoveV2` called, file moved
- [ ] Delete with confirm → `filesDeleteV2` called, removed from grid
- [ ] Right-click → context menu at cursor; all operations work
- [ ] Drag onto window → DropZone highlights; files uploaded to Dropbox
- [ ] Select files → "Copy URLs" enabled; selecting only folders → disabled
- [ ] CopyUrlsModal opens with Dropbox shared link URLs (raw=1 format)
- [ ] Group=3, 9 files → 3 rows of 3 in preview with thumbnails
- [ ] Sort Name ↑ → alphabetical reorder
- [ ] Sort Count → numeric order by number in filename
- [ ] "Copy for Excel" → paste into Excel shows correct column layout (TSV)
- [ ] "Copy as JSON" → valid `[["url",...],...]`
- [ ] Keyboard: Ctrl+A, Delete, Escape, F2, Ctrl+C, Ctrl+X, Ctrl+V work
- [ ] Access token never exposed to browser (only in /api/* server routes)
- [ ] `npm run build` → no errors
