'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Upload, Loader2, ChevronRight, FolderPlus,
  Trash2, RefreshCw, Images, FolderOpen, Folder, Check, X,
} from 'lucide-react'
import MediaLibrary from '@/components/admin/MediaLibrary'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'

// ─── Build nested tree from blob list ─────────────────────────────────────────

function buildTree(blobs) {
  const root = new Map()

  for (const b of blobs) {
    if (!b.folder) continue
    const parts = b.folder.split('/')
    let cur = root
    let curPath = ''
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      curPath = curPath ? `${curPath}/${name}` : name
      if (!cur.has(name)) cur.set(name, { name, path: curPath, count: 0, children: new Map() })
      if (!b.isPlaceholder) cur.get(name).count++
      cur = cur.get(name).children
    }
  }

  function toArray(map) {
    return [...map.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((n) => ({ ...n, children: toArray(n.children) }))
  }
  return toArray(root)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { addToast } = useToast()

  const [allBlobs, setAllBlobs]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeFolder, setActiveFolder] = useState('')
  const [expanded, setExpanded]   = useState(new Set())

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  // Inline-add state: which folder path is showing the "new subfolder" input
  const [addingUnder, setAddingUnder]     = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  const [confirmFolder, setConfirmFolder] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const fileInputRef = useRef(null)

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/media')
      const data = await res.json()
      const blobs = data.blobs || []
      setAllBlobs(blobs)
      const topLevel = [...new Set(blobs.map((b) => b.folder?.split('/')[0]).filter(Boolean))]
      setExpanded(new Set(topLevel))
    } catch {
      addToast('Failed to load media', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadAll() }, [loadAll])

  const tree = useMemo(() => buildTree(allBlobs), [allBlobs])

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

  // ─── Inline folder create ─────────────────────────────────────────────────

  function startAdding(path) {
    setAddingUnder(path)
    setNewFolderName('')
    // ensure the parent is expanded so the inline input is visible
    setExpanded((prev) => new Set([...prev, path]))
  }

  function cancelAdding() {
    setAddingUnder(null)
    setNewFolderName('')
  }

  async function createFolder() {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    try {
      const res  = await fetch('/api/admin/media/folders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newFolderName.trim(), parentPath: addingUnder || 'santhya-media' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAddingUnder(null)
      setNewFolderName('')
      addToast(`Folder "${data.folder.name}" created`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setCreatingFolder(false)
    }
  }

  // ─── Folder delete ────────────────────────────────────────────────────────

  async function deleteFolder(node) {
    // santhya-images folders are auto-detected — cannot be deleted via metadata
    if (!node.path.startsWith('santhya-media/')) {
      addToast('Only Media Library folders can be deleted', 'error')
      setConfirmFolder(null)
      return
    }
    try {
      const res  = await fetch(`/api/admin/media/folders/${node.path}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { addToast(data.error, 'error'); return }
      if (activeFolder === node.path || activeFolder.startsWith(node.path + '/')) {
        setActiveFolder('')
      }
      addToast('Folder deleted', 'success')
    } catch {
      addToast('Delete failed', 'error')
    } finally {
      setConfirmFolder(null)
    }
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

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
      <div className="w-60 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">

        {/* All Media */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
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
            <span className="text-[11px] text-gray-400">{allBlobs.length}</span>
          </button>
        </div>

        {/* Tree */}
        <nav className="flex-1 overflow-y-auto pt-1 pb-3
          [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-xs text-gray-400 italic px-4 py-3">No files yet</p>
          ) : (
            tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                expanded={expanded}
                activeFolder={activeFolder}
                addingUnder={addingUnder}
                newFolderName={newFolderName}
                creatingFolder={creatingFolder}
                onToggle={toggle}
                onSelect={setActiveFolder}
                onAdd={startAdding}
                onDelete={(node) => setConfirmFolder(node)}
                onNewFolderNameChange={setNewFolderName}
                onCreateFolder={createFolder}
                onCancelAdding={cancelAdding}
              />
            ))
          )}
        </nav>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
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
    </div>
  )
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

function TreeNode({
  node, depth, expanded, activeFolder,
  addingUnder, newFolderName, creatingFolder,
  onToggle, onSelect, onAdd, onDelete,
  onNewFolderNameChange, onCreateFolder, onCancelAdding,
}) {
  const isExpanded  = expanded.has(node.path)
  const isActive    = activeFolder === node.path
  const isAncestor  = activeFolder.startsWith(node.path + '/')
  const hasChildren = node.children.length > 0
  const isAddingHere = addingUnder === node.path

  const indent = depth * 14 + 4

  return (
    <div>
      {/* Row */}
      <div
        className={`group flex items-center transition-colors ${
          isActive ? 'bg-indigo-50' : isAncestor ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Chevron */}
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          className={`flex-shrink-0 w-6 h-8 flex items-center justify-center ${
            hasChildren || isAddingHere
              ? 'text-gray-400 hover:text-gray-700'
              : 'text-transparent pointer-events-none'
          }`}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isExpanded || isAddingHere ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* Icon + Name */}
        <button
          type="button"
          onClick={() => {
            onSelect(node.path)
            if ((hasChildren || isAddingHere) && !isExpanded) onToggle(node.path)
          }}
          className={`flex-1 flex items-center gap-2 py-1.5 text-[13px] min-w-0 transition-colors ${
            isActive ? 'text-indigo-700 font-semibold' : 'text-gray-700'
          }`}
        >
          {isActive || isExpanded || isAddingHere
            ? <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-amber-400'}`} />
            : <Folder    className={`w-4 h-4 flex-shrink-0 ${isAncestor ? 'text-amber-400' : 'text-gray-400'}`} />
          }
          <span className="flex-1 truncate">{node.name}</span>
          <span className={`text-[11px] flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`}>
            {node.count}
          </span>
        </button>

        {/* Action icons — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pr-1.5">
          <button
            type="button"
            title="Add folder"
            onClick={(e) => { e.stopPropagation(); onAdd(node.path) }}
            className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete folder"
            onClick={(e) => { e.stopPropagation(); onDelete(node) }}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children + inline-add input */}
      {(isExpanded || isAddingHere) && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 border-l border-gray-100"
            style={{ left: `${indent + 14}px` }}
          />

          {/* Existing child folders */}
          {hasChildren && node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeFolder={activeFolder}
              addingUnder={addingUnder}
              newFolderName={newFolderName}
              creatingFolder={creatingFolder}
              onToggle={onToggle}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
              onNewFolderNameChange={onNewFolderNameChange}
              onCreateFolder={onCreateFolder}
              onCancelAdding={onCancelAdding}
            />
          ))}

          {/* Inline "add folder" input */}
          {isAddingHere && (
            <div
              className="flex items-center gap-1 py-1 pr-2"
              style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => onNewFolderNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreateFolder()
                  if (e.key === 'Escape') onCancelAdding()
                }}
                placeholder="Folder name…"
                className="flex-1 text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
              />
              <button
                type="button"
                onClick={onCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="flex-shrink-0 p-1 rounded text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
              >
                {creatingFolder
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />
                }
              </button>
              <button
                type="button"
                onClick={onCancelAdding}
                className="flex-shrink-0 p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
