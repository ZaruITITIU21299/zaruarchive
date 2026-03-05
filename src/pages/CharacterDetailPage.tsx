import { useParams, Link } from 'react-router-dom'
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip'

const PLACEHOLDER_CHARACTER = {
  id: '1',
  name: 'Jinhsi',
  title: 'Magistrate of Jinzhou',
  rarity: '5-Star',
  type: 'Resonator',
  faction: 'Jinzhou',
  attribute: 'Spectro',
  weapon: 'Broadblade',
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCULIm2fuEifACxNoVQ6c3VYrjR8c7LJqZRZDk6WSUnlc2R_jzO2n3z6zrTKPV7oRlldP_LO8Yrhm54HleJphVAsXfvay2gKPZ3FdTplZFEyClIls9ubEwYd1C19hqsPtbB1LAsrVNg_vX5ma8l7EUf_9g45gAxFq6tmAhqfoNkMbig-q-2p8dBxgvTGLzPPXAiv1h2yVAC6dMJM59d0ZFT9jp8MGBa9bGY7bbIVv9OaR4KbxamAU7XJfHqzUCN10UaiWoKNzN6waCL',
  tags: ['#Magistrate', '#DragonBreath', '#SentinelAppointed', '#MainStory', '#JinzhouLeadership'],
}

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const character = { ...PLACEHOLDER_CHARACTER, id: id ?? PLACEHOLDER_CHARACTER.id }

  return (
    <div className="min-h-screen text-slate-200">
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Database</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to="/characters" className="hover:text-primary transition-colors">Resonators</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-white font-medium">{character.name}</span>
        </nav>

        {/* Detail Card */}
        <div className="glass-panel w-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[700px] border border-white/5">
          {/* Left Column - Portrait */}
          <div className="relative lg:w-5/12 min-h-[400px] lg:min-h-0">
            <img
              src={character.imageUrl}
              alt={character.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101e23] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#101e23]/60 hidden lg:block" />

            <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                  {character.rarity}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/30">
                  {character.type}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight font-[--font-display]">
                {character.name}
              </h1>
              <p className="text-slate-300 italic text-sm">{character.title}</p>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:w-7/12 p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-full px-4 py-2">
                <span className="material-symbols-outlined text-[18px] text-indigo-400">location_city</span>
                <span className="text-sm text-slate-300">Faction</span>
                <span className="text-sm font-semibold text-indigo-400">{character.faction}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-full px-4 py-2">
                <span className="material-symbols-outlined text-[18px] text-yellow-400">auto_awesome</span>
                <span className="text-sm text-slate-300">Attribute</span>
                <span className="text-sm font-semibold text-yellow-400">{character.attribute}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-full px-4 py-2">
                <span className="material-symbols-outlined text-[18px] text-primary">swords</span>
                <span className="text-sm text-slate-300">Weapon</span>
                <span className="text-sm font-semibold text-primary">{character.weapon}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="text-lg font-bold text-white font-[--font-display] tracking-tight">
                Archive Records
              </h2>
              <span className="material-symbols-outlined text-[20px] text-slate-500">menu_book</span>
            </div>

            <div className="h-[300px] overflow-y-auto pr-2 text-sm leading-relaxed text-slate-300 space-y-4">
              <p>
                Jinhsi serves as the current Magistrate of Jinzhou, bearing the immense weight of
                governance over one of the last great human strongholds. Her bond with the{' '}
                <GlossaryTooltip term="Sentinel Jué">Sentinel Jué</GlossaryTooltip> is the
                cornerstone of Jinzhou's defense — a pact passed down through generations of
                Magistrates who channeled the dragon's might to shield the city from existential
                threats. Despite her composed exterior and measured diplomacy, Jinhsi carries the
                quiet burden of every soul who depends on her leadership.
              </p>
              <p>
                The cataclysm known as the <GlossaryTooltip term="Lament">Lament</GlossaryTooltip>{' '}
                scarred the world irrevocably, fracturing civilizations and leaving behind echoes of
                devastation that persist to this day. Jinhsi has studied every surviving record of
                the event, driven by the belief that understanding the Lament is the only path to
                ensuring humanity's future. Her archives hold fragments of pre-Lament knowledge that
                most scholars consider lost forever.
              </p>
              <p>
                Beyond the city walls, phenomena such as{' '}
                <GlossaryTooltip term="Retroact Rain">Retroact Rain</GlossaryTooltip> — downpours
                that rewind local ecosystems to previous states — pose constant environmental
                hazards. The ever-present threat of{' '}
                <GlossaryTooltip term="Tacet Discord">Tacet Discord</GlossaryTooltip>, hostile
                entities born from the world's lingering dissonance, demands perpetual vigilance.
                Jinhsi coordinates Jinzhou's patrols and research teams to monitor both phenomena,
                seeking patterns that might predict and mitigate their worst effects.
              </p>
              <p>
                In battle, Jinhsi wields Spectro energy channeled through her Broadblade with
                precision that belies its weight. Her{' '}
                <GlossaryTooltip term="Resonance Liberation">
                  Resonance Liberation
                </GlossaryTooltip>{' '}
                calls upon the golden light of Sentinel Jué itself, unleashing a devastating wave
                that purges Tacet Discord from the battlefield. Those who have witnessed it describe
                the sight as a fleeting return of the sun — a reminder that even in this fractured
                age, hope endures.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {character.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-transparent hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
