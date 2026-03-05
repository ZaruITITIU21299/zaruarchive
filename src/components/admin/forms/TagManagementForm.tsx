import { useState, useEffect, type FormEvent } from 'react'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminService } from '@/services/AdminService'

interface TagManagementFormProps {
  onClose: () => void
}

interface TagRow {
  id: string
  slug: string
  label: string
}

export function TagManagementForm({ onClose }: TagManagementFormProps) {
  const { gameId, game } = useGame()
  const { lang } = useLanguage()

  const [tags, setTags] = useState<TagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState('')
  const [editLabel, setEditLabel] = useState('')

  const [newSlug, setNewSlug] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const loadTags = async () => {
    setLoading(true)
    try {
      const svc = new AdminService(gameId, lang)
      const result = await svc.fetchTags()
      setTags(result)
    } catch {
      setError('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTags() }, [gameId, lang])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newSlug.trim() || !newLabel.trim()) {
      setError('Slug and label are required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const svc = new AdminService(gameId, lang)
      await svc.createTag(
        newSlug.trim().toLowerCase().replace(/\s+/g, '_'),
        newLabel.trim(),
      )
      setNewSlug('')
      setNewLabel('')
      setAdding(false)
      await loadTags()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editSlug.trim() || !editLabel.trim()) return
    setSaving(true)
    try {
      const svc = new AdminService(gameId, lang)
      await svc.updateTag(id, editSlug.trim(), editLabel.trim())
      setEditingId(null)
      await loadTags()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const svc = new AdminService(gameId, lang)
      await svc.deleteTag(id)
      setDeleteConfirm(null)
      await loadTags()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = (tag: TagRow) => {
    setEditingId(tag.id)
    setEditSlug(tag.slug)
    setEditLabel(tag.label)
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
                Manage Tags
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {game.name} &middot; Tags are used to categorize terms and filter content
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
          ) : tags.length === 0 && !adding ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">label</span>
              <p className="text-slate-500 text-sm">No tags defined yet.</p>
              <p className="text-slate-600 text-xs mt-1">Add tags like "place", "organization", "character", etc.</p>
            </div>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
              >
                {editingId === tag.id ? (
                  <div className="flex-1 flex gap-2 items-center">
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      placeholder="slug"
                    />
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      placeholder="Label"
                    />
                    <button
                      onClick={() => handleEdit(tag.id)}
                      disabled={saving}
                      className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">label</span>
                      <span className="text-sm font-medium text-white">{tag.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/5">
                        {tag.slug}
                      </span>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(tag)}
                        className="p-1.5 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Edit tag"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      {deleteConfirm === tag.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(tag.id)}
                            disabled={deleting}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                          >
                            {deleting ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-slate-400 hover:text-white transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(tag.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete tag"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}

          {adding && (
            <form onSubmit={handleAdd} className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <p className="text-sm font-medium text-primary mb-2">New Tag</p>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Slug (unique key)</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="e.g. place, organization"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400 mb-1 block">Label (display name)</span>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Place, Organization"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </label>
              </div>

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
                  {saving ? 'Creating...' : 'Create Tag'}
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
              Add Tag
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
