import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGame } from '@/contexts/GameContext'

const previewCards = [
  {
    icon: 'update',
    label: 'LATEST ENTRY',
    title: 'The Thaw',
    description: 'Analysis of the post-cryostasis events and environmental shifts.',
    cardClass: 'hover:border-primary/30',
    barClass: 'via-primary/50',
    iconClass: 'text-primary',
    titleHoverClass: 'group-hover:text-primary',
  },
  {
    icon: 'person_add',
    label: 'NEW OPERATIVE',
    title: 'Unit 734',
    description: 'Combat data and resonance compatibility assessment.',
    cardClass: 'hover:border-secondary/30',
    barClass: 'via-secondary/50',
    iconClass: 'text-secondary',
    titleHoverClass: 'group-hover:text-secondary',
  },
  {
    icon: 'public',
    label: 'MAP UPDATE',
    title: 'Sector 4',
    description: 'Topological changes recorded in the southern wastes.',
    cardClass: 'hover:border-emerald-400/30',
    barClass: 'via-emerald-400/50',
    iconClass: 'text-emerald-400',
    titleHoverClass: 'group-hover:text-emerald-400',
  },
] as const

export default function HomePage() {
  const { t } = useLanguage()
  const { game } = useGame()

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-10 py-20 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="mb-8 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25" />
            <div className="relative bg-surface-dark border border-glass-border px-4 py-1 rounded text-xs font-mono text-primary tracking-widest uppercase">
              System Online
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Initializing <br />
            <span className="text-white drop-shadow-[0_0_15px_var(--color-primary)]">
              Zaru Archive...
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 text-center max-w-2xl mb-4 font-light leading-relaxed">
            {t('welcome.subtitle')}
          </p>
          <p className="text-sm text-primary/60 font-mono tracking-wider uppercase mb-12">
            Currently viewing: {game.name}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center">
            <Link
              to="/timeline"
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 hover:border-primary rounded-xl transition-all duration-300 w-full sm:w-auto overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-primary/10 transition-all duration-[250ms] ease-out group-hover:w-full" />
              <span className="material-symbols-outlined relative z-10">history</span>
              <span className="text-base font-bold tracking-wide relative z-10">
                {t('btn.explore_timeline')}
              </span>
            </Link>

            <Link
              to="/characters"
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/50 hover:border-secondary rounded-xl transition-all duration-300 w-full sm:w-auto overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-secondary/10 transition-all duration-[250ms] ease-out group-hover:w-full" />
              <span className="material-symbols-outlined relative z-10">group</span>
              <span className="text-base font-bold tracking-wide relative z-10">
                {t('btn.browse_characters')}
              </span>
            </Link>
          </div>

          <div className="mt-24 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewCards.map((card) => (
              <div
                key={card.label}
                className={`glass-panel p-6 rounded-2xl border border-glass-border ${card.cardClass} transition-all group cursor-pointer relative overflow-hidden`}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${card.barClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div className="flex items-center gap-3 mb-4">
                  <span className={`material-symbols-outlined ${card.iconClass}`}>
                    {card.icon}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{card.label}</span>
                </div>
                <h3
                  className={`text-xl font-bold text-white mb-2 ${card.titleHoverClass} transition-colors`}
                >
                  {card.title}
                </h3>
                <p className="text-sm text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-glass-border py-8 text-center text-slate-500 text-sm">
          <p>&copy; 2025 Zaru Archive Project. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
