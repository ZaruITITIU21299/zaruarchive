import { useState, useEffect, type FormEvent } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminService } from '@/services/AdminService'
import type { Term } from '@/types'

interface TermFormProps {
  term?: Term | null
  onSave: (data: TermFormData) => Promise<void>
  onCancel: () => void
}

export interface TermFormData {
  term_en: string
  term_vi: string
  definition_en: string
  definition_vi: string
  related_terms: string
  tag_ids: string[]
}

interface TagOption {
  id: string
  slug: string
  label: string
}

export function TermForm({ term, onSave, onCancel }: TermFormProps) {
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const isEdit = !!term

  const [tags, setTags] = useState<TagOption[]>([])
  const [loadingTags, setLoadingTags] = useState(true)

  const [form, setForm] = useState<TermFormData>({
    term_en: term?.term ?? '',
    term_vi: '',
    definition_en: term?.definition ?? '',
    definition_vi: '',
    related_terms: term?.relatedTerms?.join(', ') ?? '',
    tag_ids: [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingTags(true)
      try {
        const svc = new AdminService(gameId, lang)
        const allTags = await svc.fetchTags()
        setTags(allTags)

        if (term?.id) {
          const existing = await svc.getEntityTagIds('term', term.id)
          setForm(prev => ({ ...prev, tag_ids: existing }))
        }
      } catch {
        // Tags may not exist yet
      } finally {
        setLoadingTags(false)
      }
    }
    load()
  }, [gameId, lang, term?.id])

  const set = (field: keyof TermFormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value as never }))

  const toggleTag = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.term_en.trim()) {
      setError('English term is required')
      return
    }
    if (!form.definition_en.trim()) {
      setError('English definition is required')
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
          {isEdit ? 'Edit Term' : 'Add Term'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Term (EN)" value={form.term_en} onChange={(v) => set('term_en', v)} required />
          <Field label="Term (VI)" value={form.term_vi} onChange={(v) => set('term_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Definition (EN)" value={form.definition_en} onChange={(v) => set('definition_en', v)} rows={4} />
          <TextArea label="Definition (VI)" value={form.definition_vi} onChange={(v) => set('definition_vi', v)} rows={4} />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <span className="text-xs text-slate-400 mb-2 block">Tags</span>
          {loadingTags ? (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-sm">
              No tags defined yet. Use "Manage Tags" in the toolbar to create tags first.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const selected = form.tag_ids.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="mb-6">
          <Field
            label="Related Terms (comma-separated names)"
            value={form.related_terms}
            onChange={(v) => set('related_terms', v)}
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
  label, value, onChange, required,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <input
        type="text"
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
