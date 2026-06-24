'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Upload, Loader2, ChevronRight, FolderPlus,
  Trash2, RefreshCw, Images, FolderOpen, Folder, Check, X,
  Pencil, Search, Square, CheckSquare,
} from 'lucide-react'
import MediaLibrary from '@/components/admin/MediaLibrary'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

// ─── Build nested tree from blob list + metadata overlay ─────────────────────

function buildTree(blobs, metaMap = new Map()) {
  const root = new Map()

  for (const b of blobs) {
    if (!b.folder) continue
    const parts = b.folder.split('/')
    let cur = root
    let curPath = ''
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i]
      curPath = curPath ? `${curPath}/${seg}` : seg
      if (!cur.has(seg)) {
        const meta = metaMap.get(curPath)
        cur.set(seg, {
          name: meta?.name || seg,
          path: curPath,
          count: 0,
          children: new Map(),
          id: meta?.id || null,
        })
      }
      if (!b.isPlaceholder) cur.get(seg).count++
      cur = cur.get(seg).children
    }
  }

  function toArray(map) {
    return [...map.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((n) => ({ ...n, children: toArray(n.children) }))
  }
  return toArray(root)
}

// ─── Filter tree by search query ─────────────────────────────────────────────

function filterTree(nodes, q) {
  if (!q) return nodes
  return nodes.flatMap((n) => {
    const children = filterTree(n.children, q)
    if (n.name.toLowerCase().includes(q) || children.length) {
      return [{ ...n, children }]
    }
    return []
  })
}

// ─── Collect all paths from tree (for select-all) ────────────────────────────

function collectPaths(nodes) {
  const paths = []
  for (const n of nodes) {
    paths.push(n.path)
    paths.push(...collectPaths(n.children))
  }
  return paths
}

// ─── Find node by path ────────────────────────────────────────────────────────

function findNode(nodes, path) {
  for (const n of nodes) {
    if (n.path === path) return n
    const found = findNode(n.children, path)
    if (found) return found
  }
  return null
}

// ─── Next Windows-style auto folder name ─────────────────────────────────────

function nextAutoName(siblings) {
  const used = new Set()
  for (const s of siblings) {
    const seg = s.path.split('/').pop()
    const m = seg.match(/^new-folder-(\d+)$/)
    if (m) used.add(parseInt(m[1]))
  }
  for (let i = 1; ; i++) {
    if (!used.has(i)) return `New Folder ${i}`
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { addToast } = useToast()

  const [allBlobs, setAllBlobs]     = useState([])
  const [folderMeta, setFolderMeta] = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeFolder, setActiveFolder] = useState('')
  const [expanded, setExpanded]     = useState(new Set())

  // Sidebar search + folder selection
  const [folderSearch, setFolderSearch] = useState('')
  const [selectedFolderPaths, setSelectedFolderPaths] = useState(new Set())

  // Upload
  const [uploading, setUploading]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  // Rename inline state
  const [renamingNode, setRenamingNode]         = useState(null) // { path, id, name }
  const [renameValue, setRenameValue]           = useState('')
  const [renamingInProgress, setRenamingInProgress] = useState(false)

  // Delete confirm
  const [confirmFolder, setConfirmFolder]       = useState(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  // Auto-create loading
  const [autoCreating, setAutoCreating] = useState(false)

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef(null)

  // ─── Load blobs + folder metadata ────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [blobsRes, metaRes] = await Promise.all([
        fetch('/api/admin/media'),
        fetch('/api/admin/media/folders'),
      ])
      const blobData = await blobsRes.json()
      const metaData = await metaRes.json()
      const blobs   = blobData.blobs   || []
      const folders = metaData.folders || []
      setAllBlobs(blobs)
      setFolderMeta(folders)
      const topLevel = [...new Set(blobs.map((b) => b.folder?.split('/')[0]).filter(Boolean))]
      setExpanded(new Set(topLevel))
    } catch {
      addToast('Failed to load media', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadAll() }, [loadAll])

  const metaMap = useMemo(() => {
    const m = new Map()
    for (const f of folderMeta) m.set(f.path, f)
    return m
  }, [folderMeta])

  const tree = useMemo(() => buildTree(allBlobs, metaMap), [allBlobs, metaMap])

  const filteredTree = useMemo(
    () => filterTree(tree, folderSearch.toLowerCase().trim()),
    [tree, folderSearch]
  )

  const allPaths = useMemo(() => collectPaths(filteredTree), [filteredTree])

  const allFoldersSelected =
    allPaths.length > 0 && allPaths.every((p) => selectedFolderPaths.has(p))

  const visibleBlobs = useMemo(() => {
    const base = activeFolder
      ? allBlobs.filter((b) => b.folder === activeFolder || b.folder.startsWith(activeFolder + '/'))
      : allBlobs
    return base.filter((b) => !b.isPlaceholder)
  }, [allBlobs, activeFolder])

  // ─── Expand toggle ────────────────────────────────────────────────────────

  function toggle(path) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  // ─── Folder checkbox selection ────────────────────────────────────────────

  function toggleFolderSelect(path) {
    setSelectedFolderPaths((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFoldersSelected) {
      setSelectedFolderPaths(new Set())
    } else {
      setSelectedFolderPaths(new Set(allPaths))
    }
  }

  // ─── Auto-create (Windows-style) folder ──────────────────────────────────

  async function autoCreateFolder(parentNode) {
    const name       = nextAutoName(parentNode.children || [])
    const parentPath = parentNode.path

    setAutoCreating(true)
    try {
      const res  = await fetch('/api/admin/media/folders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, parentPath }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      addToast(`Folder "${data.folder.name}" created`, 'success')
      await loadAll()
      // Ensure parent stays expanded, then enter rename mode on the new folder
      setExpanded((prev) => new Set([...prev, parentPath]))
      setRenamingNode({ path: data.folder.path, id: data.folder.id, name: data.folder.name })
      setRenameValue(data.folder.name)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setAutoCreating(false)
    }
  }

  // ─── Rename ───────────────────────────────────────────────────────────────

  function startRename(node) {
    if (!node.id) { addToast('System folders cannot be renamed', 'error'); return }
    setRenamingNode(node)
    setRenameValue(node.name)
  }

  function cancelRename() {
    setRenamingNode(null)
    setRenameValue('')
  }

  async function commitRename() {
    if (!renamingNode) return
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === renamingNode.name) { cancelRename(); return }

    setRenamingInProgress(true)
    try {
      const res  = await fetch(`/api/admin/media/folders/${renamingNode.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Rename failed')
      addToast('Folder renamed', 'success')
      cancelRename()
      await loadAll()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setRenamingInProgress(false)
    }
  }

  // ─── Delete single folder ─────────────────────────────────────────────────

  async function deleteFolder(node) {
    if (!node.id) {
      addToast('System folders cannot be deleted', 'error')
      setConfirmFolder(null)
      return
    }
    try {
      const res  = await fetch(`/api/admin/media/folders/${node.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { addToast(data.error, 'error'); return }
      if (activeFolder === node.path || activeFolder.startsWith(node.path + '/')) {
        setActiveFolder('')
      }
      addToast('Folder deleted', 'success')
      await loadAll()
    } catch {
      addToast('Delete failed', 'error')
    } finally {
      setConfirmFolder(null)
    }
  }

  // ─── Bulk delete selected folders ────────────────────────────────────────

  async function bulkDeleteFolders() {
    const paths = [...selectedFolderPaths]
    let deleted = 0
    for (const path of paths) {
      const node = findNode(tree, path)
      if (!node?.id) continue
      try {
        const res  = await fetch(`/api/admin/media/folders/${node.id}`, { method: 'DELETE' })
        if (res.ok) {
          deleted++
        } else {
          const data = await res.json()
          addToast(`${node.name}: ${data.error}`, 'error')
        }
      } catch {
        addToast(`Failed to delete "${node.name}"`, 'error')
      }
    }
    if (deleted) {
      addToast(`Deleted ${deleted} folder${deleted !== 1 ? 's' : ''}`, 'success')
      setSelectedFolderPaths(new Set())
      await loadAll()
    }
    setConfirmBulkDelete(false)
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  function uploadSubfolder() {
    if (activeFolder.startsWith('santhya-media/')) return activeFolder.replace('santhya-media/', '')
    return 'general'
  }

  async function handleUpload(files) {
    if (!files.length) return
    const folder = uploadSubfolder()
    setUploading(true)
    setUploadProgress(`0 of ${files.length}`)
    const BATCH = 5
    let uploaded = []
    for (let i = 0; i < files.length; i += BATCH) {
      const batch = [...files].slice(i, i + BATCH)
      const fd = new FormData()
      fd.append('folder', folder)
      for (const f of batch) fd.append('files', f)
      try {
        const res  = await fetch('/api/admin/media', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        uploaded = [...uploaded, ...data.uploaded]
        setUploadProgress(`${Math.min(i + BATCH, files.length)} of ${files.length}`)
      } catch (err) {
        addToast(err.message, 'error')
      }
    }
    if (uploaded.length) {
      setAllBlobs((prev) => [...uploaded, ...prev])
      addToast(`Uploaded ${uploaded.length} file${uploaded.length !== 1 ? 's' : ''}`, 'success')
    }
    setUploading(false)
    setUploadProgress(null)
  }

  function handleBlobsDeleted(urls) {
    setAllBlobs((prev) => prev.filter((b) => !urls.includes(b.url)))
  }

  const onDragOver  = (e) => { e.preventDefault(); setIsDraggingOver(true) }
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false) }
  const onDrop      = (e) => { e.preventDefault(); setIsDraggingOver(false); handleUpload([...e.dataTransfer.files]) }

  const activeFolderLabel = useMemo(() => {
    if (!activeFolder) return 'All Media'
    return activeFolder.split('/').pop()
  }, [activeFolder])

  const totalFileCount = useMemo(
    () => allBlobs.filter((b) => !b.isPlaceholder).length,
    [allBlobs]
  )

  return (
    <div
      className="flex h-full relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-indigo-600/10 border-4 border-dashed border-indigo-400 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-indigo-500" />
            <p className="text-base font-semibold text-gray-700">
              Drop to upload → <strong>santhya-media/{uploadSubfolder()}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">

        {/* Search + select-all + refresh */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search folders…"
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {folderSearch && (
              <button
                type="button"
                onClick={() => setFolderSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {allFoldersSelected
                ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                : <Square className="w-3.5 h-3.5" />
              }
              Select all
            </button>

            <div className="flex items-center gap-1">
              {selectedFolderPaths.size > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                >
                  Delete {selectedFolderPaths.size}
                </button>
              )}
              <button
                type="button"
                onClick={loadAll}
                disabled={loading}
                title="Refresh folders"
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* All Media row */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveFolder('')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeFolder === ''
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Images className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">All Media</span>
            <span className="text-[11px] text-gray-400">{totalFileCount}</span>
          </button>
        </div>

        {/* Folder tree */}
        <nav className="flex-1 overflow-y-auto pb-3
          [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : filteredTree.length === 0 ? (
            <p className="text-xs text-gray-400 italic px-4 py-3">
              {folderSearch ? 'No matching folders' : 'No files yet'}
            </p>
          ) : (
            filteredTree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                expanded={expanded}
                activeFolder={activeFolder}
                selectedFolderPaths={selectedFolderPaths}
                renamingNode={renamingNode}
                renameValue={renameValue}
                renamingInProgress={renamingInProgress}
                autoCreating={autoCreating}
                onToggle={toggle}
                onSelect={setActiveFolder}
                onDelete={(node) => {
                  if (!node.id) { addToast('System folders cannot be deleted', 'error'); return }
                  setConfirmFolder(node)
                }}
                onRename={startRename}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={cancelRename}
                onToggleFolderSelect={toggleFolderSelect}
                onAutoCreate={autoCreateFolder}
              />
            ))
          )}
        </nav>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 capitalize">{activeFolderLabel}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {visibleBlobs.length} file{visibleBlobs.length !== 1 ? 's' : ''}
              {activeFolder && <> · <code className="text-[11px] text-gray-500">{activeFolder}/</code></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{uploadProgress}</>
                : <><Upload className="w-4 h-4" />Upload Files</>
              }
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <MediaLibrary blobs={visibleBlobs} loading={loading} onDelete={handleBlobsDeleted} />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,image/svg+xml,application/pdf"
        className="hidden"
        onChange={(e) => { handleUpload([...e.target.files]); e.target.value = '' }}
      />

      {confirmFolder && (
        <ConfirmDialog
          open
          title={`Delete folder "${confirmFolder.name}"?`}
          description="The folder must be empty. Type the folder name below to confirm deletion."
          confirmText={confirmFolder.name}
          onConfirm={() => deleteFolder(confirmFolder)}
          onCancel={() => setConfirmFolder(null)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          open
          title={`Delete ${selectedFolderPaths.size} folder${selectedFolderPaths.size !== 1 ? 's' : ''}?`}
          description="Only empty folders will be deleted. Folders with files will be skipped with an error."
          confirmText="delete"
          onConfirm={bulkDeleteFolders}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  )
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

function TreeNode({
  node, depth, expanded, activeFolder,
  selectedFolderPaths, renamingNode, renameValue, renamingInProgress, autoCreating,
  onToggle, onSelect, onDelete, onRename, onRenameChange, onRenameCommit, onRenameCancel,
  onToggleFolderSelect, onAutoCreate,
}) {
  const isExpanded  = expanded.has(node.path)
  const isActive    = activeFolder === node.path
  const isAncestor  = activeFolder.startsWith(node.path + '/')
  const hasChildren = node.children.length > 0
  const isRenaming  = renamingNode?.path === node.path
  const isSelected  = selectedFolderPaths.has(node.path)

  const indent = depth * 14 + 4
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  return (
    <div>
      {/* Row */}
      <div
        className={`group flex items-center transition-colors ${
          isActive ? 'bg-indigo-50' : isAncestor ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFolderSelect(node.path) }}
          className={`flex-shrink-0 w-5 h-8 flex items-center justify-center mr-0.5 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
          }`}>
            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
        </button>

        {/* Expand chevron */}
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className={`flex-shrink-0 w-5 h-8 flex items-center justify-center ${
            hasChildren
              ? 'text-gray-400 hover:text-gray-700'
              : 'text-transparent pointer-events-none'
          }`}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Rename inline input */}
        {isRenaming ? (
          <div className="flex-1 flex items-center gap-1 py-1 min-w-0 pr-1">
            <FolderOpen className="w-4 h-4 flex-shrink-0 text-indigo-400" />
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit()
                if (e.key === 'Escape') onRenameCancel()
              }}
              className="flex-1 text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
            />
            <button
              type="button"
              onClick={onRenameCommit}
              disabled={renamingInProgress || !renameValue.trim()}
              className="flex-shrink-0 p-1 rounded text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
            >
              {renamingInProgress
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
            </button>
            <button
              type="button"
              onClick={onRenameCancel}
              className="flex-shrink-0 p-1 rounded text-gray-400 hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Folder name button */}
            <button
              type="button"
              onClick={() => {
                onSelect(node.path)
                if (hasChildren && !isExpanded) onToggle(node.path)
              }}
              className={`flex-1 flex items-center gap-2 py-1.5 text-[13px] min-w-0 transition-colors ${
                isActive ? 'text-indigo-700 font-semibold' : 'text-gray-700'
              }`}
            >
              {isActive || isExpanded
                ? <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-amber-400'}`} />
                : <Folder    className={`w-4 h-4 flex-shrink-0 ${isAncestor ? 'text-amber-400' : 'text-gray-400'}`} />
              }
              <span className="flex-1 truncate">{node.name}</span>
              <span className={`text-[11px] flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`}>
                {node.count}
              </span>
            </button>

            {/* Hover actions: Rename + Delete only */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pr-1.5">
              <button
                type="button"
                title="Rename"
                onClick={(e) => { e.stopPropagation(); onRename(node) }}
                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); onDelete(node) }}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Expanded children + New Folder button */}
      {isExpanded && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 border-l border-gray-100"
            style={{ left: `${indent + 14}px` }}
          />

          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeFolder={activeFolder}
              selectedFolderPaths={selectedFolderPaths}
              renamingNode={renamingNode}
              renameValue={renameValue}
              renamingInProgress={renamingInProgress}
              autoCreating={autoCreating}
              onToggle={onToggle}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              onRenameChange={onRenameChange}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
              onToggleFolderSelect={onToggleFolderSelect}
              onAutoCreate={onAutoCreate}
            />
          ))}

          {/* New Folder button inside every expanded folder */}
          <div
            className="py-0.5 pr-2"
            style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAutoCreate(node) }}
              disabled={autoCreating}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded px-2 py-1 transition-colors disabled:opacity-40 w-full"
            >
              {autoCreating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <FolderPlus className="w-3 h-3" />
              }
              New Folder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
