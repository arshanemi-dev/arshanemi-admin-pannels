'use client'
import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Images } from 'lucide-react'
import { useToast } from './Toast'
import MediaPicker from './MediaPicker'

export default function ImageUpload({ value, onChange, collection = 'general', label = 'Image' }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const { addToast } = useToast()

  async function upload(file) {
    if (!file) return
    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) {
      addToast(`File must be under ${maxMB}MB`, 'error')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('collection', collection)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onChange(data.url)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function remove() {
    if (!value) return
    onChange(null)
    if (value.includes('blob.vercel-storage.com')) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      })
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {value ? (
        <div className="relative group w-40 h-32 rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 rounded-lg bg-white text-gray-700 hover:bg-gray-100 text-xs font-medium"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={remove}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                {dragging ? (
                  <Upload className="w-5 h-5 text-indigo-500" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">
                <span className="text-indigo-600 font-medium">Click to upload</span> or drag & drop
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
            </>
          )}
        </div>
      )}

      {/* Choose from library */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:underline mt-0.5 w-fit"
      >
        <Images className="w-3.5 h-3.5" />
        Choose from Library
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => { onChange(url); setPickerOpen(false) }}
      />
    </div>
  )
}
