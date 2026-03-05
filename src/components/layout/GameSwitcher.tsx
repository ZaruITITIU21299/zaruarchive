import { useState, useRef, useEffect } from 'react'
import { useGame } from '@/contexts/GameContext'
import { GAMES, GAME_IDS } from '@/config/games'

interface GameSwitcherProps {
  compact?: boolean
}

export function GameSwitcher({ compact = false }: GameSwitcherProps) {
  const { gameId, game, setGameId } = useGame()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const size = compact ? 'h-9 w-9' : 'h-12 w-12'
  const iconSize = compact ? 'text-base' : 'text-xl'

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`bg-gradient-to-br from-primary to-secondary rounded-full ${size} p-0.5 shadow-[0_0_15px_var(--color-primary)] hover:scale-105 transition-transform cursor-pointer`}
        title="Switch game"
      >
        <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center">
          <span className={`material-symbols-outlined text-primary ${iconSize}`}>{game.icon}</span>
        </div>
      </button>

      {open && (
        <div className={`absolute mt-2 w-72 rounded-xl border border-glass-border bg-surface-dark/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden ${
          compact ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full left-0'
        }`}
          style={{ animation: 'fadeIn 150ms ease-out' }}
        >
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Switch Archive</p>
          </div>

          <div className="p-2">
            {GAME_IDS.map((id) => {
              const g = GAMES[id]
              const isActive = id === gameId
              return (
                <button
                  key={id}
                  onClick={() => { setGameId(id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-primary/15 border border-primary/25'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary/20' : 'bg-white/5'
                    }`}
                    style={isActive ? undefined : { backgroundColor: `${GAMES[id].theme.primary}15` }}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ color: GAMES[id].theme.primary }}
                    >
                      {g.icon}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-white'}`}>
                      {g.name}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">{g.description}</span>
                  </div>

                  {isActive && (
                    <span className="material-symbols-outlined text-primary text-base ml-auto shrink-0">check_circle</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-[10px] text-slate-600 text-center">More games coming soon</p>
          </div>
        </div>
      )}
    </div>
  )
}
