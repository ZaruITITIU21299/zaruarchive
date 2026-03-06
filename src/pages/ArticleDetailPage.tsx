import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGame } from '@/contexts/GameContext'
import { useAdmin } from '@/contexts/AdminContext'
import { ArticleService } from '@/services/ArticleService'
import type { Article } from '@/types'
import { parseArticleContent } from '@/utils/articleContent'
import { ArticleContentBlocks } from '@/components/article/ArticleContentBlocks'
import { EditableArticleContent } from '@/components/article/EditableArticleContent'

const RELATED = [
  {
    title: 'Void Walker Migration: Year 3042 Census',
    category: 'EVENT LOG',
    excerpt: 'Annual tracking data reveals unexpected pattern shifts near the galactic rim.',
    date: 'Dec 12, 3044',
  },
  {
    title: 'Neo-Terra Signal Relay Station Logs',
    category: 'THEORY',
    excerpt: 'Decrypted relay logs suggest coordinated emissions from an unknown source.',
    date: 'Nov 28, 3044',
  },
]

const ARTICLE_TAGS = ['Anomaly', 'Sector 7', 'Signals', 'Void Walkers', 'Deep Space']

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()
  const { gameId } = useGame()
  const { editMode } = useAdmin()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchArticle = useCallback(() => {
    if (!id || !gameId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setNotFound(false)
    const svc = new ArticleService(gameId, lang)
    svc.fetchById(id).then((a) => {
      setArticle(a ?? null)
      setNotFound(!a)
    }).finally(() => setLoading(false))
  }, [id, gameId, lang])

  useEffect(() => { fetchArticle() }, [fetchArticle, refreshKey])

  const contentBlocks = article?.content ? parseArticleContent(article.content) : []
  const hasBlocks = contentBlocks.length > 0

  const handleSaved = () => setRefreshKey((k) => k + 1)

  if (loading) {
    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-500">article</span>
        <p className="text-slate-400">Article not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-100">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-40 glass-header h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-sm hidden sm:inline">Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <Link to="/articles" className="hover:text-primary transition-colors">Articles</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-300">Theories</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary truncate max-w-[200px]">{article.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#223f49] bg-white/5 text-xs font-bold text-slate-300 hover:text-white hover:border-primary/50 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            {lang === 'en' ? 'EN' : 'VI'}
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            SA
          </div>
        </div>
      </header>

      {/* Article content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Article header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-primary/80">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 bg-[#16262c] rounded-full px-4 py-1.5 text-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
              <span className="text-slate-300">{formatDate(article.publishedAt)}</span>
            </span>
            {article.readTimeMin != null && (
              <span className="inline-flex items-center gap-2 bg-[#16262c] rounded-full px-4 py-1.5 text-sm">
                <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                <span className="text-slate-300">{article.readTimeMin} min read</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {ARTICLE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-[#223f49]/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 cursor-pointer transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 border border-[#223f49]/50 transition-all">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
              </button>
              <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 border border-[#223f49]/50 transition-all">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#223f49] to-transparent mb-10" />

        {/* Article body */}
        {editMode ? (
          <EditableArticleContent
            blocks={contentBlocks}
            articleId={article.id}
            onSaved={handleSaved}
          />
        ) : hasBlocks ? (
          <ArticleContentBlocks blocks={contentBlocks} />
        ) : article.content?.trim() ? (
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
            {article.content}
          </div>
        ) : (
          <p className="text-slate-500">No content yet.</p>
        )}

        {/* Related Records */}
        <div className="mt-16">
          <div className="h-px bg-gradient-to-r from-transparent via-[#223f49] to-transparent mb-10" />
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">library_books</span>
            Related Records
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {RELATED.map((item) => (
              <div
                key={item.title}
                className="glass-panel rounded-xl p-6 hover:bg-surface-dark/80 border border-[#223f49]/50 hover:border-primary/30 cursor-pointer transition-all group"
              >
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3 ${
                  item.category === 'THEORY'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {item.category}
                </span>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{item.excerpt}</p>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
