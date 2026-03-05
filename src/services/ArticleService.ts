import { BaseService } from './BaseService'
import type { Article, ArticleListItem } from '@/types'

export class ArticleService extends BaseService {
  async fetchAll(section?: string): Promise<ArticleListItem[]> {
    let query = this.db
      .from('articles')
      .select(`
        id, game_id, section, image_path, read_time_min, is_featured,
        published_at,
        article_translations!inner ( title, summary )
      `)
      .eq('game_id', this.gameId)
      .eq('article_translations.lang', this.lang)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })

    if (section) {
      query = query.eq('section', section)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch articles: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapListItem(row))
  }

  async fetchFeatured(): Promise<ArticleListItem[]> {
    const { data, error } = await this.db
      .from('articles')
      .select(`
        id, game_id, section, image_path, read_time_min, is_featured,
        published_at,
        article_translations!inner ( title, summary )
      `)
      .eq('game_id', this.gameId)
      .eq('article_translations.lang', this.lang)
      .eq('is_featured', true)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(`Failed to fetch featured articles: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapListItem(row))
  }

  async fetchById(id: string): Promise<Article | null> {
    const { data, error } = await this.db
      .from('articles')
      .select(`
        id, game_id, section, image_path, read_time_min, is_featured,
        related_character_id, published_at,
        article_translations!inner ( title, summary, content )
      `)
      .eq('id', id)
      .eq('article_translations.lang', this.lang)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch article: ${error.message}`)
    if (!data) return null

    return this.mapDetail(data as Record<string, unknown>)
  }

  private mapListItem(row: Record<string, unknown>): ArticleListItem {
    const trans = (row.article_translations as Array<Record<string, string>>)?.[0] ?? {}
    return {
      id: row.id as string,
      gameId: row.game_id as string,
      section: row.section as string,
      imagePath: (row.image_path as string) ?? null,
      readTimeMin: (row.read_time_min as number) ?? null,
      isFeatured: (row.is_featured as boolean) ?? false,
      publishedAt: (row.published_at as string) ?? null,
      title: trans.title ?? '',
      summary: trans.summary ?? '',
    }
  }

  private mapDetail(row: Record<string, unknown>): Article {
    const trans = (row.article_translations as Array<Record<string, string>>)?.[0] ?? {}
    return {
      id: row.id as string,
      gameId: row.game_id as string,
      section: row.section as string,
      imagePath: (row.image_path as string) ?? null,
      readTimeMin: (row.read_time_min as number) ?? null,
      isFeatured: (row.is_featured as boolean) ?? false,
      relatedCharacterId: (row.related_character_id as string) ?? null,
      publishedAt: (row.published_at as string) ?? null,
      title: trans.title ?? '',
      summary: trans.summary ?? '',
      content: trans.content ?? '',
      attributes: [],
    }
  }
}
