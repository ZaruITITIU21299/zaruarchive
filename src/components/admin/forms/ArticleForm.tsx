import { useState, type FormEvent } from 'react'
import { ImageUpload } from '../ImageUpload'
import { useGame } from '@/contexts/GameContext'

interface ArticleFormProps {
  article?: { id: string; title: string; summary: string; content?: string; imagePath: string | null; section: string; readTimeMin: number | null; isFeatured: boolean } | null
  defaultSection?: string
  onSave: (data: ArticleFormData) => Promise<void>
  onCancel: () => void
}

export interface ArticleFormData {
  title_en: string
  title_vi: string
  summary_en: string
  summary_vi: string
  content_en: string
  content_vi: string
  section: string
  image_path: string | null
  read_time_min: number | null
  is_featured: boolean
}

export function ArticleForm({ article, defaultSection = 'theory', onSave, onCancel }: ArticleFormProps) {
  const { gameId } = useGame()
  const isEdit = !!article

  const [form, setForm] = useState<ArticleFormData>({
    title_en: article?.title ?? '',
    title_vi: '',
    summary_en: article?.summary ?? '',
    summary_vi: '',
    content_en: article?.content ?? '',
    content_vi: '',
    section: article?.section ?? defaultSection,
    image_path: article?.imagePath ?? null,
    read_time_min: article?.readTimeMin ?? null,
    is_featured: article?.isFeatured ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof ArticleFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title_en.trim()) {
      setError('English title is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-4xl mx-4 bg-surface-dark border border-glass-border rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-white mb-6 font-[--font-display]">
          {isEdit ? 'Edit Article' : 'Add Article'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <ImageUpload
          currentPath={form.image_path}
          storagePath={`${gameId}/articles`}
          onUpload={(path) => set('image_path', path)}
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Title (EN)" value={form.title_en} onChange={(v) => set('title_en', v)} required />
          <Field label="Title (VI)" value={form.title_vi} onChange={(v) => set('title_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Summary (EN)" value={form.summary_en} onChange={(v) => set('summary_en', v)} rows={3} />
          <TextArea label="Summary (VI)" value={form.summary_vi} onChange={(v) => set('summary_vi', v)} rows={3} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Content (EN)" value={form.content_en} onChange={(v) => set('content_en', v)} rows={8} />
          <TextArea label="Content (VI)" value={form.content_vi} onChange={(v) => set('content_vi', v)} rows={8} />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">Section</span>
            <select
              value={form.section}
              onChange={(e) => set('section', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="theory">Theory</option>
              <option value="lore">Lore</option>
              <option value="article">Article</option>
            </select>
          </label>
          <Field
            label="Read Time (min)"
            value={form.read_time_min?.toString() ?? ''}
            onChange={(v) => set('read_time_min', v ? Number(v) : null)}
            type="number"
          />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set('is_featured', e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-slate-300">Featured</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label, value, onChange, required, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
      />
    </label>
  )
}

function TextArea({
  label, value, onChange, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
      />
    </label>
  )
}
