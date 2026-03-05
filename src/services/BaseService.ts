import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Abstract base for all game-scoped, language-aware data services.
 * Subclasses set `tableName` and `translationTable`, then get
 * filtering, language, and game scoping for free.
 */
export abstract class BaseService {
  protected db: SupabaseClient
  protected gameId: string
  protected lang: string

  constructor(gameId: string, lang = 'en') {
    this.db = supabase
    this.gameId = gameId
    this.lang = lang
  }

  setLanguage(lang: string) {
    this.lang = lang
  }

  setGame(gameId: string) {
    this.gameId = gameId
  }

  protected publishedFilter() {
    return { status: 'published' as const }
  }
}
