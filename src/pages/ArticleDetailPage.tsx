import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

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

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, setLang } = useLanguage()

  void id

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
            <span className="text-primary truncate max-w-[200px]">The Great Filter of Sector 7</span>
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
            The Great Filter of Sector 7: Anomalous Signal Patterns
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 bg-[#16262c] rounded-full px-4 py-1.5 text-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">person</span>
              <span className="text-slate-300">Dr. Elara Voss</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-[#16262c] rounded-full px-4 py-1.5 text-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
              <span className="text-slate-300">Feb 24, 3045</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-[#16262c] rounded-full px-4 py-1.5 text-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
              <span className="text-slate-300">12 min read</span>
            </span>
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
        <article className="prose prose-invert max-w-none space-y-8">
          <p className="text-lg text-slate-300 leading-relaxed">
            For decades, the outer boundary of <span className="glossary-link">Sector 7</span> has
            remained one of the most enigmatic regions in charted space. What began as routine
            electromagnetic interference has evolved into a complex web of recurring signal patterns
            that defy conventional astrophysical models. This report compiles findings from three
            independent research stations and proposes a unified theory for the anomalies.
          </p>

          <blockquote className="glass-panel p-6 rounded-xl border-l-4 border-primary not-italic">
            <p className="text-slate-200 text-base leading-relaxed mb-3">
              "The signals aren't random. They carry structure — a periodicity that suggests
              intentionality. Whether that intent is biological, mechanical, or something else
              entirely remains the central question."
            </p>
            <footer className="text-sm text-primary font-medium">
              — Dr. Elara Voss, Lead Analyst, Zephyr Station
            </footer>
          </blockquote>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              <span className="text-primary font-mono">01.</span> Signal Origin &amp; Detection History
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              The first anomalous transmission was logged in Cycle 2987 by the automated relay
              network orbiting <span className="glossary-link">Helios IV</span>. Initially
              dismissed as stellar noise, subsequent analysis revealed a consistent 47.3-second
              interval between pulse clusters — a signature too precise for natural phenomena.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Cross-referencing with <span className="glossary-link">Void Walker</span> migration
              data revealed a striking correlation: signal intensity peaks coincide with documented
              swarm movements within a 0.3 parsec margin of error. The implications of this
              correlation are explored in Section 02.
            </p>
          </section>

          <figure className="rounded-xl overflow-hidden border border-[#223f49]/50">
            <img
              src="https://placehold.co/900x400/0a1216/0db9f2?text=Signal+Pattern+Visualization"
              alt="Signal pattern visualization showing recurring pulse clusters"
              className="w-full"
            />
            <figcaption className="bg-[#101e23] px-5 py-3 text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">image</span>
              Fig 1. Signal pattern overlay from Relay Stations Alpha, Beta, and Gamma (Cycles 2987–3044)
            </figcaption>
          </figure>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              <span className="text-primary font-mono">02.</span> Void Walker Correlation Hypothesis
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              The <span className="glossary-link">Void Walkers</span> — an ancient nomadic species
              renowned for their stealth capabilities — have long been suspected of utilizing
              unconventional communication methods. The correlation between their migratory patterns
              and the Sector 7 signals opens several theoretical pathways:
            </p>

            <ul className="space-y-3">
              {[
                'The signals may serve as navigational beacons for swarm coordination across deep space.',
                'Frequency modulations could encode territorial boundaries recognizable to other species.',
                'Pulse timing aligns with theorized Void Walker bio-rhythmic cycles documented by Dr. Kael.',
                'Signal degradation patterns suggest a source moving at sub-light speeds — consistent with known Void Walker propulsion.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

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
