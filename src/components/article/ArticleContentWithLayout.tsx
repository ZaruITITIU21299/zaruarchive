import type { ArticleBlock } from '@/types'
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip'
import { useEffect, useState } from 'react'

interface ArticleContentWithLayoutProps {
  blocks: ArticleBlock[]
}

/**
 * Renders article content with intelligent placement algorithm:
 * - Section titles remain full-width
 * - Other content (paragraphs, figures, quotes, lists) are scaled to 90% of page width
 * - Figures (images) alternate left-right (zigzag pattern)
 * - Text wraps next to figures
 * - Images are scaled to fit on fullHD screens
 */
export function ArticleContentWithLayout({ blocks }: ArticleContentWithLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Listen for sidebar state changes via window events
  useEffect(() => {
    const handleSidebarChange = (e: CustomEvent<{ collapsed: boolean }>) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    // Try to detect sidebar state from DOM
    const updateSidebarState = () => {
      const mainElement = document.querySelector('main')?.parentElement
      if (mainElement) {
        const margin = window.getComputedStyle(mainElement).marginLeft
        const marginPixels = parseInt(margin)
        setSidebarCollapsed(marginPixels < 150)
      }
    }

    // Check initial state
    updateSidebarState()

    // Monitor
    window.addEventListener('sidebarToggle', handleSidebarChange as EventListener)
    const resizeObserver = new ResizeObserver(updateSidebarState)
    const mainElement = document.querySelector('main')?.parentElement
    if (mainElement) {
      resizeObserver.observe(mainElement)
    }

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarChange as EventListener)
      resizeObserver.disconnect()
    }
  }, [])

  if (blocks.length === 0) return null

  // Group consecutive blocks for layout
  // Section titles create boundaries, other blocks are grouped
  const layoutGroups: LayoutGroup[] = []
  let currentGroup: ArticleBlock[] = []

  for (const block of blocks) {
    if (block.type === 'section') {
      if (currentGroup.length > 0) {
        layoutGroups.push({
          type: 'content',
          blocks: currentGroup,
        })
        currentGroup = []
      }
      layoutGroups.push({ type: 'section', block })
    } else {
      currentGroup.push(block)
    }
  }

  if (currentGroup.length > 0) {
    layoutGroups.push({
      type: 'content',
      blocks: currentGroup,
    })
  }

  return (
    <article className="space-y-8">
      {layoutGroups.map((group, idx) => {
        if (group.type === 'section' && group.block) {
          return (
            <section key={`section-${idx}`}>
              <h2 className="text-2xl font-bold text-white mb-4">
                <span className="text-primary font-mono">{group.block.number}.</span> {group.block.title}
              </h2>
            </section>
          )
        }

        return (
          <ContentGroup
            key={`content-${idx}`}
            blocks={group.blocks!}
          />
        )
      })}
    </article>
  )
}

interface LayoutGroup {
  type: 'section' | 'content'
  block?: ArticleBlock & { type: 'section' }
  blocks?: ArticleBlock[]
}

interface ContentGroupProps {
  blocks: ArticleBlock[]
}

/**
 * Renders a group of content blocks with figure positioned left.
 * Layout is 90% of available page width.
 * Uses float layout so text wraps naturally around figures.
 */
function ContentGroup({ blocks }: ContentGroupProps) {
  // Find figure in blocks
  const figureIndex = blocks.findIndex((b) => b.type === 'figure')
  const hasFigure = figureIndex !== -1

  if (!hasFigure) {
    // No figure, render all blocks at 90% width
    return (
      <div className="max-w-[90%] mx-auto space-y-6">
        {blocks.map((block, idx) => (
          <BlockRenderer key={idx} block={block} />
        ))}
      </div>
    )
  }

  const figure = blocks[figureIndex] as ArticleBlock & { type: 'figure' }
  const beforeBlocks = blocks.slice(0, figureIndex)
  const afterBlocks = blocks.slice(figureIndex + 1)

  return (
    <div>
      {/* Content before figure - full width at 90% */}
      {beforeBlocks.length > 0 && (
        <div className="max-w-[90%] mx-auto mb-6 space-y-6">
          {beforeBlocks.map((block, idx) => (
            <BlockRenderer key={idx} block={block} />
          ))}
        </div>
      )}

      {/* Figure floated left, text wraps around it */}
      <div className="max-w-[90%] mx-auto">
        <div className="overflow-auto">
          {/* Float figure left - text will wrap around it */}
          <div className="float-left w-[35%] mr-6 mb-4">
            <FigureRenderer key={`fig-${figureIndex}`} block={figure} />
          </div>

          {/* Text content flows around floated figure */}
          <div className="space-y-4">
            {afterBlocks.map((block, idx) => (
              <BlockRenderer key={idx} block={block} />
            ))}
          </div>

          {/* Clear the float to ensure content below doesn't wrap */}
          <div className="clear-both" />
        </div>
      </div>
    </div>
  )
}

/**
 * Renders a single block (non-figure)
 */
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

  return null
}

/**
 * Renders a figure block with image scaling for fullHD screens
 * Constraints:
 * - Max width: 600px (fits within 35% column on fullHD)
 * - Max height: 700px (fits within viewport on fullHD 1080p)
 * - Maintains aspect ratio
 */
function FigureRenderer({ block }: { block: ArticleBlock & { type: 'figure' } }) {
  if (!block.imageUrl.trim()) return null

  return (
    <figure className="rounded-xl overflow-hidden border border-[#223f49]/50 h-fit">
      <img
        src={block.imageUrl}
        alt={block.alt ?? block.caption ?? ''}
        className="w-full h-auto max-w-[600px] max-h-[700px] object-contain"
        loading="lazy"
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
