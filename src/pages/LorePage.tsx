import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '@/contexts/AdminContext'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminService } from '@/services/AdminService'
import { ArticleService } from '@/services/ArticleService'
import { ArticleForm, type ArticleFormData } from '@/components/admin/forms/ArticleForm'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ArticleListItem } from '@/types'

type LoreType = 'All' | 'Mythology' | 'World History' | 'Faction Record' | 'Legend'

/** Display shape for a lore card (API data + optional placeholder fields for UI). */
interface LoreEntry {
  id: string
  title: string
  excerpt: string
  type: Exclude<LoreType, 'All'>
  source: string
  era: string
}

function formatListDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toLoreEntry(item: ArticleListItem): LoreEntry {
  return {
    id: item.id,
    title: item.title,
    excerpt: item.summary,
    type: 'Mythology',
    source: '—',
    era: formatListDate(item.publishedAt),
  }
}

const LORE_TYPES: LoreType[] = ['All', 'Mythology', 'World History', 'Faction Record', 'Legend']

const TYPE_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  Mythology:        { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: 'auto_stories' },
  'World History':  { bg: 'bg-sky-500/15',     text: 'text-sky-400',     icon: 'public' },
  'Faction Record': { bg: 'bg-amber-500/15',   text: 'text-amber-400',   icon: 'shield' },
  Legend:           { bg: 'bg-rose-500/15',     text: 'text-rose-400',    icon: 'local_fire_department' },
}

/** Example/placeholder entries for reference (not used when real data is loaded). */
const EXAMPLE_ENTRIES: LoreEntry[] = [
  { id: '1', title: 'The Lament — A World Unmade', excerpt: 'Before the skies darkened and the frequencies shattered, there was a single, piercing note that resonated through every living thing on Solaris-3.', type: 'Mythology', source: 'Jinzhou Archive, Vol. III', era: 'Pre-Lament' },
  { id: '2', title: 'Founding of the Black Shores', excerpt: 'Born from necessity in the chaos following the Collapse, the mercenary collective known as the Black Shores was forged by deserters, exiles, and the desperate.', type: 'Faction Record', source: 'Black Shores Manifest', era: 'Post-Collapse' },
  { id: '3', title: 'The Sentinels of Old', excerpt: 'Towering guardians that once roamed freely across the continents, the Sentinels were the last line of defense against the frequencies that threatened to unravel reality.', type: 'Legend', source: 'Oral Tradition Archive', era: 'Ancient' },
  { id: '4', title: 'Rise and Fall of the Aetherium Grid', excerpt: 'For three centuries, the Aetherium Grid powered civilizations across the surface. Its catastrophic failure during the Collapse remains the single most studied event in history.', type: 'World History', source: 'Federation Central Record', era: 'Third Epoch' },
  { id: '5', title: 'The Dragon Pact of Jinzhou', excerpt: 'When Magistrate Lin first bound her fate to the Sentinel Jué, she unknowingly established a tradition that would protect the city for generations to come.', type: 'Mythology', source: 'Jinzhou Archive, Vol. I', era: 'Second Epoch' },
  { id: '6', title: 'Neo-Terra: From Colony to Capital', excerpt: 'What began as a frontier outpost evolved through political upheaval and strategic alliances into the seat of the United Federation\'s governance.', type: 'World History', source: 'Federation Historical Review', era: 'Modern' },
]

const SORT_OPTIONS = ['Newest', 'Oldest', 'A → Z'] as const

export default function LorePage() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<LoreType>('All')
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('Newest')
  const { editMode } = useAdmin()
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null)
  const [editingArticle, setEditingArticle] = useState<Awaited<ReturnType<AdminService['getArticle']>> | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLore = () => {
    if (!gameId || !lang) return
    setLoadingList(true)
    const svc = new ArticleService(gameId, lang)
    svc.fetchAll('lore').then((data) => setArticles(data)).finally(() => setLoadingList(false))
  }

  useEffect(() => {
    fetchLore()
  }, [gameId, lang])

  const entries: LoreEntry[] = useMemo(() => articles.map(toLoreEntry), [articles])

  const handleSave = async (data: ArticleFormData) => {
    const svc = new AdminService(gameId, lang)
    if (editingEntry) {
      await svc.updateArticle(editingEntry.id, {
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'lore',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      })
    } else {
      await svc.createArticle({
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'lore',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      })
    }
    setFormOpen(false)
    setEditingEntry(null)
    setEditingArticle(null)
    fetchLore()
  }

  const openEditForm = (entry: LoreEntry) => {
    setEditingEntry(entry)
    setEditingArticle(null)
    setLoadingArticle(true)
    const svc = new AdminService(gameId, lang)
    svc.getArticle(entry.id).then((article) => {
      setEditingArticle(article ?? null)
      if (article) setFormOpen(true)
    }).finally(() => setLoadingArticle(false))
  }

  const openAddForm = () => {
    setEditingEntry(null)
    setEditingArticle(null)
    setFormOpen(true)
  }

  const formArticle = formOpen && editingEntry && editingArticle
    ? {
        id: editingArticle.id,
        title: editingArticle.translations.en?.title ?? '',
        summary: editingArticle.translations.en?.summary ?? '',
        content_en: editingArticle.translations.en?.content ?? undefined,
        content_vi: editingArticle.translations.vi?.content ?? undefined,
        title_vi: editingArticle.translations.vi?.title ?? '',
        summary_vi: editingArticle.translations.vi?.summary ?? '',
        imagePath: editingArticle.image_path,
        section: editingArticle.section,
        readTimeMin: editingArticle.read_time_min,
        isFeatured: editingArticle.is_featured,
      }
    : null

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const svc = new AdminService(gameId, lang)
    await svc.deleteArticle(deleteTarget)
    setDeleteTarget(null)
    setDeleting(false)
    fetchLore()
  }

  const filtered = useMemo(() => {
    let results = entries.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.excerpt.toLowerCase().includes(search.toLowerCase())
      const matchesType = activeType === 'All' || e.type === activeType
      return matchesSearch && matchesType
    })
    if (sort === 'A → Z') results = [...results].sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'Oldest') results = [...results].reverse()
    return results
  }, [entries, search, activeType, sort])

  const typeStyle = (t: string) => TYPE_STYLE[t] ?? TYPE_STYLE.Mythology

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">auto_stories</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Lore Compendium
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">
              Canonical stories, myths, and world-building records
            </p>
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-0.5 text-xs font-bold">
              {filtered.length} entries
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sticky top-0 z-40 bg-surface-dark p-4 rounded-xl border border-border-dark/30 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lore entries..."
                className="w-full bg-background-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-surface-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {LORE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === t
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {editMode && (
          <div className="mb-6">
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Lore Entry
            </button>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loadingList ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-emerald-400">progress_activity</span>
            </div>
          ) : (
          <>
          {filtered.map((entry) => {
            const ts = typeStyle(entry.type)
            return (
              <div key={entry.id} className="relative group">
              <Link
                to={`/lore/${entry.id}`}
                className="bg-surface-light/50 hover:bg-surface-light border border-border-dark hover:border-emerald-500/40 rounded-lg p-5 cursor-pointer transition-colors block"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${ts.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className={`material-symbols-outlined text-lg ${ts.text}`}>{ts.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-white font-semibold text-base group-hover:text-emerald-400 transition-colors">
                        {entry.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ts.bg} ${ts.text}`}>
                        {entry.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {entry.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">source</span>
                        {entry.source}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-border-dark/50 font-mono">
                        {entry.era}
                      </span>
                    </div>
                  </div>
                  {editMode ? (
                    <div className="flex gap-1.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditForm(entry) }}
                        className="p-1.5 rounded text-amber-400 hover:bg-amber-500/20 transition-colors"
                        disabled={loadingArticle}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(entry.id) }}
                        className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all text-[20px] shrink-0 mt-1 hidden md:block">
                      arrow_forward
                    </span>
                  )}
                </div>
              </Link>
              </div>
            )
          })}
          </>
          )}
          {!loadingList && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
              <p className="text-lg">No lore entries match your search.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filtered.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 border border-border-dark hover:bg-white/10 hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
              Next
            </button>
          </div>
        </div>
      </main>

      {formOpen && (
        <ArticleForm
          article={formArticle}
          defaultSection="lore"
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditingEntry(null); setEditingArticle(null) }}
        />
      )}
      {loadingArticle && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
          <span className="material-symbols-outlined animate-spin text-4xl text-white">progress_activity</span>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Lore Entry"
        message="This lore entry will be soft-deleted and hidden from visitors."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
