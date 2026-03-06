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

type ArticleType = 'All' | 'Editorial' | 'Guide' | 'Event Recap' | 'Analysis'

/** Display shape for an article card (API data + optional placeholder fields for UI). */
interface ArticleEntry {
  id: string
  title: string
  summary: string
  type: Exclude<ArticleType, 'All'>
  author: string
  date: string
  readMin: number
  tags: string[]
}

function formatListDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toArticleEntry(item: ArticleListItem): ArticleEntry {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    type: 'Editorial',
    author: '—',
    date: formatListDate(item.publishedAt),
    readMin: item.readTimeMin ?? 0,
    tags: [],
  }
}

const ARTICLE_TYPES: ArticleType[] = ['All', 'Editorial', 'Guide', 'Event Recap', 'Analysis']

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  Editorial:      { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  Guide:          { bg: 'bg-sky-500/15',      text: 'text-sky-400' },
  'Event Recap':  { bg: 'bg-emerald-500/15',  text: 'text-emerald-400' },
  Analysis:       { bg: 'bg-rose-500/15',     text: 'text-rose-400' },
}

/** Example/placeholder entries for reference (not used when real data is loaded). */
const EXAMPLE_ENTRIES: ArticleEntry[] = [
  { id: '1', title: 'Beginner\'s Guide to Resonance Mechanics', summary: 'A comprehensive walkthrough of how Resonance works in combat, from basic frequency matching to advanced Liberation chains.', type: 'Guide', author: 'Commander Rho', date: 'Feb 26', readMin: 8, tags: ['Beginner', 'Combat'] },
  { id: '2', title: 'Patch 2.4 Recap: The Verdant Anomaly', summary: 'Everything that happened during the Verdant Anomaly event, including hidden story triggers, limited rewards, and community milestones.', type: 'Event Recap', author: 'Event Desk', date: 'Feb 22', readMin: 5, tags: ['Event', 'Patch 2.4'] },
  { id: '3', title: 'Why the Sentinel System Needs a Rework', summary: 'An opinionated look at the current limitations of the Sentinel bonding mechanic and proposals for making it more impactful.', type: 'Editorial', author: 'Nyx', date: 'Feb 18', readMin: 12, tags: ['Opinion', 'Sentinel'] },
  { id: '4', title: 'Deep Dive: Jinzhou Defense Network Efficiency', summary: 'Statistical analysis of patrol route optimization and resource allocation in the Jinzhou perimeter defense system.', type: 'Analysis', author: 'Dr. Elara Voss', date: 'Feb 14', readMin: 15, tags: ['Data', 'Jinzhou'] },
  { id: '5', title: 'Farming Efficiency: Waveplates per Day', summary: 'Optimal daily routines for maximizing Waveplate usage, including domain priority lists and time-gated material breakdowns.', type: 'Guide', author: 'Archivist Kael', date: 'Feb 10', readMin: 6, tags: ['Farming', 'Optimization'] },
  { id: '6', title: 'Community Art Showcase: January Highlights', summary: 'The best fan art, cosplay, and creative works from the community during January, curated by the editorial team.', type: 'Editorial', author: 'Creative Division', date: 'Feb 03', readMin: 4, tags: ['Community', 'Art'] },
]

const SORT_OPTIONS = ['Newest', 'Oldest', 'A → Z'] as const

export default function ArticlesPage() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<ArticleType>('All')
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('Newest')
  const { editMode } = useAdmin()
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ArticleEntry | null>(null)
  const [editingArticle, setEditingArticle] = useState<Awaited<ReturnType<AdminService['getArticle']>> | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchArticles = () => {
    if (!gameId || !lang) return
    setLoadingList(true)
    const svc = new ArticleService(gameId, lang)
    svc.fetchAll('article').then((data) => setArticles(data)).finally(() => setLoadingList(false))
  }

  useEffect(() => {
    fetchArticles()
  }, [gameId, lang])

  const entries: ArticleEntry[] = useMemo(() => articles.map(toArticleEntry), [articles])

  const handleSave = async (data: ArticleFormData) => {
    const svc = new AdminService(gameId, lang)
    if (editingEntry) {
      await svc.updateArticle(editingEntry.id, {
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'article',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      })
    } else {
      await svc.createArticle({
        title: { en: data.title_en, vi: data.title_vi },
        summary: { en: data.summary_en, vi: data.summary_vi },
        content: { en: data.content_en, vi: data.content_vi },
        section: 'article',
        image_path: data.image_path,
        read_time_min: data.read_time_min,
        is_featured: data.is_featured,
      })
    }
    setFormOpen(false)
    setEditingEntry(null)
    setEditingArticle(null)
    fetchArticles()
  }

  const openEditForm = (entry: ArticleEntry) => {
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
    fetchArticles()
  }

  const filtered = useMemo(() => {
    let results = entries.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.summary.toLowerCase().includes(search.toLowerCase())
      const matchesType = activeType === 'All' || e.type === activeType
      return matchesSearch && matchesType
    })
    if (sort === 'A → Z') results = [...results].sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'Oldest') results = [...results].reverse()
    return results
  }, [entries, search, activeType, sort])

  const tStyle = (t: string) => TYPE_STYLE[t] ?? TYPE_STYLE.Editorial

  return (
    <div className="min-h-screen text-slate-100">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-amber-400 text-3xl">newspaper</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Article Feed
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 text-lg">
              Community write-ups, event recaps, and editorial pieces
            </p>
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full px-3 py-0.5 text-xs font-bold">
              {filtered.length} articles
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
                placeholder="Search articles..."
                className="w-full bg-background-dark border border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-surface-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARTICLE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === t
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Article
            </button>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loadingList ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-amber-400">progress_activity</span>
            </div>
          ) : (
          <>
          {filtered.map((entry) => {
            const ts = tStyle(entry.type)
            return (
              <div key={entry.id} className="relative group">
              <Link
                to={`/articles/${entry.id}`}
                className="bg-surface-light/50 hover:bg-surface-light border border-border-dark hover:border-amber-500/40 rounded-lg p-5 cursor-pointer transition-colors block"
              >
                <div className="md:grid md:grid-cols-12 gap-4 items-start">
                  {/* Title + summary */}
                  <div className="md:col-span-8 mb-3 md:mb-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-white font-semibold text-base group-hover:text-amber-400 transition-colors">
                        {entry.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ts.bg} ${ts.text}`}>
                        {entry.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {entry.summary}
                    </p>
                  </div>

                  {/* Meta column */}
                  <div className="md:col-span-3 flex md:flex-col items-start md:items-end gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {entry.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {entry.readMin} min read
                    </span>
                    <span className="font-mono text-slate-600">{entry.date}</span>
                  </div>

                  {/* Arrow / Admin */}
                  <div className="md:col-span-1 hidden md:flex justify-end items-center h-full gap-1.5">
                    {editMode ? (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <span className="material-symbols-outlined text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all text-[20px]">
                        arrow_forward
                      </span>
                    )}
                  </div>
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
              <p className="text-lg">No articles match your search.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filtered.length}</span> articles
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 border border-border-dark hover:bg-white/10 hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
              Next
            </button>
          </div>
        </div>
      </main>

      {formOpen && (
        <ArticleForm
          article={formArticle}
          defaultSection="article"
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
        title="Delete Article"
        message="This article will be soft-deleted and hidden from visitors."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
