import type {
  ArticleBlock,
  ArticleBlockBlockquote,
  ArticleBlockFigure,
  ArticleBlockList,
  ArticleBlockParagraph,
  ArticleBlockSection,
} from '@/types'

/**
 * Parse stored article content (JSON string) into blocks.
 * Returns empty array for null or empty.
 * For invalid JSON (legacy HTML/text), returns a single paragraph block with the raw string so the form doesn't lose it.
 */
export function parseArticleContent(content: string | null | undefined): ArticleBlock[] {
  if (content == null || content.trim() === '') return []
  try {
    const parsed = JSON.parse(content) as unknown
    if (!Array.isArray(parsed)) return legacyFallback(content)
    const blocks = parsed.filter((item): item is ArticleBlock => isArticleBlock(item))
    return blocks.length > 0 ? blocks : legacyFallback(content)
  } catch {
    return legacyFallback(content)
  }
}

function legacyFallback(content: string): ArticleBlock[] {
  if (content.trim() === '') return []
  return [{ type: 'paragraph', segments: [{ type: 'text', value: content }] }]
}

function isArticleBlock(value: unknown): value is ArticleBlock {
  if (value == null || typeof value !== 'object' || !('type' in value)) return false
  const t = (value as { type: string }).type
  switch (t) {
    case 'paragraph':
      return 'segments' in value && Array.isArray((value as ArticleBlockParagraph).segments)
    case 'blockquote':
      return 'quote' in value && 'footer' in value && typeof (value as ArticleBlockBlockquote).quote === 'string' && typeof (value as ArticleBlockBlockquote).footer === 'string'
    case 'section':
      return 'number' in value && 'title' in value && typeof (value as ArticleBlockSection).number === 'string' && typeof (value as ArticleBlockSection).title === 'string'
    case 'list':
      return 'items' in value && Array.isArray((value as ArticleBlockList).items)
    case 'figure':
      return 'imageUrl' in value && 'caption' in value && typeof (value as ArticleBlockFigure).imageUrl === 'string' && typeof (value as ArticleBlockFigure).caption === 'string'
    default:
      return false
  }
}

/**
 * Serialize blocks to JSON string for storage in article_translations.content.
 */
export function serializeArticleContent(blocks: ArticleBlock[]): string {
  return JSON.stringify(blocks)
}
