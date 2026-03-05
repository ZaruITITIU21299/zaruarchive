import { useState, type FormEvent } from 'react'
import { ImageUpload } from '../ImageUpload'
import { useGame } from '@/contexts/GameContext'
import type { TimelineEvent } from '@/types'

interface EventFormProps {
  event?: TimelineEvent | null
  timelineId: string
  onSave: (data: EventFormData) => Promise<void>
  onCancel: () => void
}

export interface EventFormData {
  title_en: string
  title_vi: string
  description_en: string
  description_vi: string
  time_label_en: string
  time_label_vi: string
  image_path: string | null
  position: number
  child_timeline_id: string
}

export function EventForm({ event, timelineId, onSave, onCancel }: EventFormProps) {
  const { gameId } = useGame()
  const isEdit = !!event

  const [form, setForm] = useState<EventFormData>({
    title_en: event?.title ?? '',
    title_vi: '',
    description_en: event?.description ?? '',
    description_vi: '',
    time_label_en: event?.timeLabel ?? '',
    time_label_vi: '',
    image_path: event?.imagePath ?? null,
    position: event?.position ?? 0,
    child_timeline_id: event?.childTimelineId ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof EventFormData, value: unknown) =>
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
        className="relative z-10 w-full max-w-3xl mx-4 bg-surface-dark border border-glass-border rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-white mb-6 font-[--font-display]">
          {isEdit ? 'Edit Event' : 'Add Event'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <ImageUpload
          currentPath={form.image_path}
          storagePath={`${gameId}/events`}
          onUpload={(path) => set('image_path', path)}
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Title (EN)" value={form.title_en} onChange={(v) => set('title_en', v)} required />
          <Field label="Title (VI)" value={form.title_vi} onChange={(v) => set('title_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Time Label (EN)" value={form.time_label_en} onChange={(v) => set('time_label_en', v)} />
          <Field label="Time Label (VI)" value={form.time_label_vi} onChange={(v) => set('time_label_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Description (EN)" value={form.description_en} onChange={(v) => set('description_en', v)} rows={4} />
          <TextArea label="Description (VI)" value={form.description_vi} onChange={(v) => set('description_vi', v)} rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field
            label="Position"
            value={form.position.toString()}
            onChange={(v) => set('position', Number(v) || 0)}
            type="number"
          />
          <Field
            label="Child Timeline ID (optional)"
            value={form.child_timeline_id}
            onChange={(v) => set('child_timeline_id', v)}
          />
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
