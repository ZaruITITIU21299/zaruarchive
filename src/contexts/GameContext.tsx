import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { GAMES, DEFAULT_GAME_ID, getGameConfig, type GameConfig, type GameTheme } from '@/config/games'

interface GameContextType {
  gameId: string
  game: GameConfig
  setGameId: (id: string) => void
}

const GameContext = createContext<GameContextType | null>(null)

function applyTheme(theme: GameTheme) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-primary-dark', theme.primaryDark)
  root.style.setProperty('--color-secondary', theme.secondary)
  root.style.setProperty('--color-accent-purple', theme.accentPurple)
  root.style.setProperty('--color-background-dark', theme.backgroundDark)
  root.style.setProperty('--color-surface-dark', theme.surfaceDark)
  root.style.setProperty('--color-surface-mid', theme.surfaceMid)
  root.style.setProperty('--color-surface-light', theme.surfaceLight)
  root.style.setProperty('--color-glass-border', theme.glassBorder)
  root.style.setProperty('--color-glass-bg', theme.glassBg)
  root.style.setProperty('--color-border-dark', theme.borderDark)

  document.body.style.backgroundColor = theme.backgroundDark
}

export function GameProvider({ children }: { children: ReactNode }) {
  const initial = localStorage.getItem('gameId') || DEFAULT_GAME_ID
  const validInitial = GAMES[initial] ? initial : DEFAULT_GAME_ID
  const [gameId, setGameIdState] = useState(validInitial)

  const game = getGameConfig(gameId)

  const setGameId = useCallback((id: string) => {
    if (!GAMES[id]) return
    setGameIdState(id)
    localStorage.setItem('gameId', id)
  }, [])

  useEffect(() => {
    applyTheme(game.theme)
  }, [game])

  return (
    <GameContext.Provider value={{ gameId, game, setGameId }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
