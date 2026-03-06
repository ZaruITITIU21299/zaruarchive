import type { ArticleBlock } from '@/types'
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip'

interface ArticleContentBlocksProps {
  blocks: ArticleBlock[]
}

/**
 * Renders article content blocks with the same styling as the Sector 7 design:
 * paragraphs with glossary links, blockquotes, numbered sections, lists, figures.
 */
export function ArticleContentBlocks({ blocks }: ArticleContentBlocksProps) {
  if (blocks.length === 0) return null

  return (
    <article className="prose prose-invert max-w-none space-y-8">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </article>
  )
}

function BlockRenderer({ block }: { block: ArticleBlock }) {
  if (block.type === 'paragraph') {
    const hasContent = block.segments.some((s) => s.value.trim() !== '')
    if (!hasContent) return null
    return (
      <p className="text-lg text-slate-300 leading-relaxed">
        {block.segments.map((seg, i) =>
          seg.type === 'glossary' ? (
            <GlossaryTooltip key={i} term={seg.value}>
              {seg.value}
            </GlossaryTooltip>
          ) : (
            <span key={i}>{seg.value}</span>
          )
        )}
      </p>
    )
  }

  if (block.type === 'blockquote') {
    if (!block.quote.trim()) return null
    return (
      <blockquote className="glass-panel p-6 rounded-xl border-l-4 border-primary not-italic">
        <p className="text-slate-200 text-base leading-relaxed mb-3">{block.quote}</p>
        {block.footer.trim() && (
          <footer className="text-sm text-primary font-medium">{block.footer}</footer>
        )}
      </blockquote>
    )
  }

  if (block.type === 'section') {
    return (
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          <span className="text-primary font-mono">{block.number}.</span> {block.title}
        </h2>
      </section>
    )
  }

  if (block.type === 'list') {
    const items = block.items.filter((s) => s.trim() !== '')
    if (items.length === 0) return null
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-slate-300">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">
              check_circle
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'figure') {
    if (!block.imageUrl.trim()) return null
    return (
      <figure className="rounded-xl overflow-hidden border border-[#223f49]/50">
        <img
          src={block.imageUrl}
          alt={block.alt ?? block.caption ?? ''}
          className="w-full"
        />
        {block.caption.trim() && (
          <figcaption className="bg-[#101e23] px-5 py-3 text-sm text-slate-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">image</span>
            {block.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  return null
}
