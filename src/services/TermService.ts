import { BaseService } from './BaseService'
import type { Term } from '@/types'

export class TermService extends BaseService {
  async fetchAll(): Promise<Term[]> {
    const { data, error } = await this.db
      .from('terms')
      .select(`
        id, game_id, category, related_terms, display_order,
        term_translations!inner ( term, definition )
      `)
      .eq('game_id', this.gameId)
      .eq('term_translations.lang', this.lang)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch terms: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapRow(row))
  }

  async fetchByCategory(category: string): Promise<Term[]> {
    const { data, error } = await this.db
      .from('terms')
      .select(`
        id, game_id, category, related_terms, display_order,
        term_translations!inner ( term, definition )
      `)
      .eq('game_id', this.gameId)
      .eq('category', category)
      .eq('term_translations.lang', this.lang)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch terms by category: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapRow(row))
  }

  private mapRow(row: Record<string, unknown>): Term {
    const trans = (row.term_translations as Array<Record<string, string>>)?.[0] ?? {}
    return {
      id: row.id as string,
      gameId: row.game_id as string,
      category: (row.category as string) ?? 'general',
      relatedTerms: (row.related_terms as string[]) ?? [],
      displayOrder: (row.display_order as number) ?? 0,
      term: trans.term ?? '',
      definition: trans.definition ?? '',
      attributes: [],
    }
  }

  filterBySearch(terms: Term[], query: string): Term[] {
    if (!query) return terms
    const q = query.toLowerCase()
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    )
  }
}
