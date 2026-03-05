import { useState, useEffect, type FormEvent } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AttributeService } from '@/services/AttributeService'
import { AdminService } from '@/services/AdminService'
import type { AttributeDefinition, ContentEntityType, AttributeDataType } from '@/types'

interface AttributeDefinitionFormProps {
  entityType: ContentEntityType
  onClose: () => void
}

const DATA_TYPES: { value: AttributeDataType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select (dropdown)' },
]

export function AttributeDefinitionForm({ entityType, onClose }: AttributeDefinitionFormProps) {
  const { gameId, game } = useGame()
  const { lang } = useLanguage()

  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [newAttr, setNewAttr] = useState({
    slug: '',
    label_en: '',
    label_vi: '',
    description_en: '',
    data_type: 'text' as AttributeDataType,
    select_options: '',
    is_filterable: false,
  })

  const loadDefinitions = async () => {
    setLoading(true)
    try {
      const svc = new AttributeService(gameId, lang)
      const defs = await svc.fetchDefinitions(entityType)
      setDefinitions(defs)
    } catch {
      setError('Failed to load attribute definitions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDefinitions() }, [gameId, lang, entityType])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newAttr.slug.trim() || !newAttr.label_en.trim()) {
      setError('Slug and English label are required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const svc = new AdminService(gameId, lang)
      await svc.createAttributeDefinition({
        entity_type: entityType,
        slug: newAttr.slug.trim().toLowerCase().replace(/\s+/g, '_'),
        data_type: newAttr.data_type,
        label_en: newAttr.label_en.trim(),
        label_vi: newAttr.label_vi.trim() || undefined,
        description_en: newAttr.description_en.trim() || undefined,
        is_filterable: newAttr.is_filterable,
        select_options: newAttr.data_type === 'select' && newAttr.select_options
          ? newAttr.select_options.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        display_order: definitions.length,
      })
      setNewAttr({ slug: '', label_en: '', label_vi: '', description_en: '', data_type: 'text', select_options: '', is_filterable: false })
      setAdding(false)
      await loadDefinitions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const svc = new AdminService(gameId, lang)
      await svc.deleteAttributeDefinition(id)
      setDeleteConfirm(null)
      await loadDefinitions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4 bg-surface-dark border border-glass-border rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-[--font-display]">
                Manage Attributes
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {game.name} &middot; {entityType} attributes
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
          ) : definitions.length === 0 && !adding ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">info</span>
              <p className="text-slate-500 text-sm">No attributes defined for {entityType}s yet.</p>
              <p className="text-slate-600 text-xs mt-1">Add one to get started.</p>
            </div>
          ) : (
            definitions.map((def) => (
              <div
                key={def.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{def.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/5">
                      {def.slug}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      def.dataType === 'text' ? 'bg-sky-500/10 text-sky-400' :
                      def.dataType === 'number' ? 'bg-amber-500/10 text-amber-400' :
                      def.dataType === 'boolean' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {def.dataType}
                    </span>
                    {def.isFilterable && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        filterable
                      </span>
                    )}
                  </div>
                  {def.description && (
                    <p className="text-xs text-slate-500 truncate">{def.description}</p>
                  )}
                  {def.selectOptions && def.selectOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {def.selectOptions.map((opt) => (
                        <span key={opt} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {deleteConfirm === def.id ? (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDelete(def.id)}
                      disabled={deleting}
                      className="px-2 py-1 rounded text-xs font-medium bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(def.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remove attribute"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            ))
          )}

          {/* Add new attribute form */}
          {adding && (
            <form onSubmit={handleAdd} className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <p className="text-sm font-medium text-primary mb-2">New Attribute</p>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Slug (unique key)</span>
                  <input
                    type="text"
                    value={newAttr.slug}
                    onChange={(e) => setNewAttr(p => ({ ...p, slug: e.target.value }))}
                    placeholder="e.g. forte, race"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Data Type</span>
                  <select
                    value={newAttr.data_type}
                    onChange={(e) => setNewAttr(p => ({ ...p, data_type: e.target.value as AttributeDataType }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  >
                    {DATA_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Label (EN)</span>
                  <input
                    type="text"
                    value={newAttr.label_en}
                    onChange={(e) => setNewAttr(p => ({ ...p, label_en: e.target.value }))}
                    placeholder="e.g. Forte"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Label (VI)</span>
                  <input
                    type="text"
                    value={newAttr.label_vi}
                    onChange={(e) => setNewAttr(p => ({ ...p, label_vi: e.target.value }))}
                    placeholder="optional"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-slate-400 mb-1 block">Description (EN, optional)</span>
                <input
                  type="text"
                  value={newAttr.description_en}
                  onChange={(e) => setNewAttr(p => ({ ...p, description_en: e.target.value }))}
                  placeholder="e.g. Character's combat specialization"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </label>

              {newAttr.data_type === 'select' && (
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Select Options (comma-separated)</span>
                  <input
                    type="text"
                    value={newAttr.select_options}
                    onChange={(e) => setNewAttr(p => ({ ...p, select_options: e.target.value }))}
                    placeholder="e.g. Sarkaz, Liberi, Cautus, Lupo"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAttr.is_filterable}
                  onChange={(e) => setNewAttr(p => ({ ...p, is_filterable: e.target.checked }))}
                  className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
                />
                <span className="text-xs text-slate-300">Filterable (show in search/filter UI)</span>
              </label>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Attribute'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 flex justify-between">
          {!adding && (
            <button
              onClick={() => { setAdding(true); setError(null) }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Attribute
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
