import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useGame } from './GameContext'
import { useLanguage } from './LanguageContext'
import { TermService } from '@/services/TermService'
import type { Term } from '@/types'

interface GlossaryContextType {
  /** All terms loaded from the database for the current game + language */
  terms: Term[]
  /** Look up a term definition by its display name (case-insensitive) */
  getDefinition: (termName: string) => string | undefined
  /** Look up a full Term object by display name (case-insensitive) */
  getTerm: (termName: string) => Term | undefined
  loading: boolean
}

const GlossaryContext = createContext<GlossaryContextType | null>(null)

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return
    setLoading(true)
    const svc = new TermService(gameId, lang)
    svc.fetchAll()
      .then((data) => setTerms(data))
      .catch(() => setTerms([]))
      .finally(() => setLoading(false))
  }, [gameId, lang])

  const lookupMap = new Map<string, Term>()
  for (const t of terms) {
    lookupMap.set(t.term.toLowerCase(), t)
  }

  const getDefinition = (termName: string) =>
    lookupMap.get(termName.toLowerCase())?.definition

  const getTerm = (termName: string) =>
    lookupMap.get(termName.toLowerCase())

  return (
    <GlossaryContext.Provider value={{ terms, getDefinition, getTerm, loading }}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('useGlossary must be used within GlossaryProvider')
  return ctx
}
