import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  currentPath: string | null
  storagePath: string
  onUpload: (path: string) => void
  className?: string
}

export function ImageUpload({ currentPath, storagePath, onUpload, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  }

  const displayUrl = preview ?? (currentPath ? getPublicUrl(currentPath) : null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    const ext = file.name.split('.').pop() || 'webp'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const fullPath = `${storagePath}/${fileName}`

    setProgress(30)

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fullPath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    setProgress(100)
    setPreview(URL.createObjectURL(file))
    onUpload(fullPath)
    setUploading(false)
  }, [storagePath, onUpload])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div className={className}>
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
          dragOver
            ? 'border-primary/60 bg-primary/10'
            : 'border-white/10 hover:border-white/20 bg-white/5'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <div className="relative">
            <img src={displayUrl} alt="Preview" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Click to change</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">upload</span>
            <span className="text-sm text-slate-400">Drop image or click to browse</span>
            <span className="text-xs text-slate-500 mt-1">Max 10MB</span>
          </div>
        )}

        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
