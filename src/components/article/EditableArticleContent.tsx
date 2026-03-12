import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type {
  ArticleBlock,
  ArticleBlockParagraph,
  ArticleBlockBlockquote,
  ArticleBlockSection,
  ArticleBlockList,
  ArticleBlockFigure,
  ParagraphSegment,
} from '@/types'
import { GlossaryTooltip } from '@/components/shared/GlossaryTooltip'
import { useGlossary } from '@/contexts/GlossaryContext'
import { serializeArticleContent } from '@/utils/articleContent'
import { AdminService } from '@/services/AdminService'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface EditableArticleContentProps {
  blocks: ArticleBlock[]
  articleId: string
  onSaved?: () => void
}

type BlockType = ArticleBlock['type']

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: 'notes' },
  { type: 'blockquote', label: 'Blockquote', icon: 'format_quote' },
  { type: 'section', label: 'Section', icon: 'title' },
  { type: 'list', label: 'List', icon: 'format_list_bulleted' },
  { type: 'figure', label: 'Figure', icon: 'image' },
]

function createBlock(type: BlockType): ArticleBlock {
  switch (type) {
    case 'paragraph':
      return { type: 'paragraph', segments: [{ type: 'text', value: '' }] }
    case 'blockquote':
      return { type: 'blockquote', quote: '', footer: '' }
    case 'section':
      return { type: 'section', number: '', title: '' }
    case 'list':
      return { type: 'list', items: [''] }
    case 'figure':
      return { type: 'figure', imageUrl: '', caption: '' }
  }
}

function segmentsToPlainText(segments: ParagraphSegment[]): string {
  return segments.map((s) => (s.type === 'glossary' ? `[[${s.value}]]` : s.value)).join('')
}

function plainTextToSegments(text: string): ParagraphSegment[] {
  const parts = text.split(/(\[\[.*?\]\])/g)
  return parts
    .filter((p) => p !== '')
    .map((p) => {
      const match = p.match(/^\[\[(.*?)\]\]$/)
      if (match) return { type: 'glossary' as const, value: match[1] }
      return { type: 'text' as const, value: p }
    })
}

export function EditableArticleContent({ blocks: initialBlocks, articleId, onSaved }: EditableArticleContentProps) {
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const [editBlocks, setEditBlocks] = useState<ArticleBlock[]>(() => structuredClone(initialBlocks))
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [addMenuIdx, setAddMenuIdx] = useState<number | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(editBlocks) !== JSON.stringify(initialBlocks),
    [editBlocks, initialBlocks],
  )

  const updateBlock = useCallback((idx: number, updated: ArticleBlock) => {
    setEditBlocks((prev) => prev.map((b, i) => (i === idx ? updated : b)))
  }, [])

  const removeBlock = useCallback((idx: number) => {
    setEditBlocks((prev) => prev.filter((_, i) => i !== idx))
    setEditingIdx(null)
  }, [])

  const moveBlock = useCallback((idx: number, dir: -1 | 1) => {
    setEditBlocks((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    setEditingIdx((prev) => (prev === idx ? idx + dir : prev))
  }, [])

  const insertBlock = useCallback((afterIdx: number, type: BlockType) => {
    setEditBlocks((prev) => {
      const next = [...prev]
      next.splice(afterIdx + 1, 0, createBlock(type))
      return next
    })
    setEditingIdx(afterIdx + 1)
    setAddMenuIdx(null)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const svc = new AdminService(gameId)
      const contentKey = lang === 'vi' ? 'vi' : 'en'
      await svc.updateArticle(articleId, {
        title: { en: '', vi: '' },
        content: { [contentKey]: serializeArticleContent(editBlocks) },
      })
      onSaved?.()
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setEditBlocks(structuredClone(initialBlocks))
    setEditingIdx(null)
  }

  return (
    <div className="relative pb-24">
      <article className="prose prose-invert max-w-[90%] mx-auto space-y-2">
        <InsertLine
          index={-1}
          addMenuIdx={addMenuIdx}
          setAddMenuIdx={setAddMenuIdx}
          insertBlock={insertBlock}
        />
        {editBlocks.map((block, idx) => (
          <div key={idx}>
            <EditableBlockWrapper
              block={block}
              index={idx}
              total={editBlocks.length}
              isEditing={editingIdx === idx}
              onStartEdit={() => setEditingIdx(idx)}
              onStopEdit={() => setEditingIdx(null)}
              onUpdate={(b) => updateBlock(idx, b)}
              onRemove={() => removeBlock(idx)}
              onMoveUp={() => moveBlock(idx, -1)}
              onMoveDown={() => moveBlock(idx, 1)}
            />
            <InsertLine
              index={idx}
              addMenuIdx={addMenuIdx}
              setAddMenuIdx={setAddMenuIdx}
              insertBlock={insertBlock}
            />
          </div>
        ))}
        {editBlocks.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2 block">article</span>
            <p>No content blocks yet. Click the + button above to add your first block.</p>
          </div>
        )}
      </article>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto mb-6 flex items-center gap-3 px-6 py-3 rounded-xl bg-[#15262d]/95 backdrop-blur-xl border border-primary/40 shadow-[0_0_30px_rgba(13,185,242,0.15)]">
            <span className="text-sm text-slate-300">Unsaved changes</span>
            <button
              onClick={handleDiscard}
              className="px-4 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white bg-white/5 border border-[#223f49] hover:border-slate-500 transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-sm text-white bg-primary hover:bg-primary/80 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Insert line between blocks ─────────────────────────────────────────── */

function InsertLine({
  index,
  addMenuIdx,
  setAddMenuIdx,
  insertBlock,
}: {
  index: number
  addMenuIdx: number | null
  setAddMenuIdx: (idx: number | null) => void
  insertBlock: (afterIdx: number, type: BlockType) => void
}) {
  const isOpen = addMenuIdx === index

  return (
    <div className="relative group flex items-center justify-center py-1">
      <div className="absolute inset-x-0 h-px bg-[#223f49]/30 group-hover:bg-primary/20 transition-colors" />
      <button
        onClick={() => setAddMenuIdx(isOpen ? null : index)}
        className="relative z-10 w-7 h-7 rounded-full bg-[#1a2e36] border border-[#223f49] hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
        title="Add block"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-primary">add</span>
      </button>
      {isOpen && (
        <div className="absolute z-20 top-full mt-1 flex items-center gap-1 p-1.5 rounded-lg bg-[#15262d]/95 backdrop-blur-xl border border-[#223f49] shadow-lg">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => insertBlock(index, bt.type)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-primary/15 transition-all"
              title={bt.label}
            >
              <span className="material-symbols-outlined text-[16px]">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Editable block wrapper with toolbar ────────────────────────────────── */

function EditableBlockWrapper({
  block,
  index,
  total,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: ArticleBlock
  index: number
  total: number
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  onUpdate: (b: ArticleBlock) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div
      className={`relative group rounded-xl transition-all ${
        isEditing
          ? 'ring-1 ring-primary/40 bg-primary/[0.03]'
          : 'hover:ring-1 hover:ring-[#223f49]/60'
      }`}
    >
      {/* Toolbar */}
      <div
        className={`absolute -top-3 right-2 z-10 flex items-center gap-0.5 p-0.5 rounded-lg bg-[#15262d]/95 backdrop-blur border border-[#223f49] shadow-md transition-opacity ${
          isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <ToolbarBtn icon="arrow_upward" onClick={onMoveUp} disabled={index === 0} title="Move up" />
        <ToolbarBtn icon="arrow_downward" onClick={onMoveDown} disabled={index === total - 1} title="Move down" />
        <div className="w-px h-4 bg-[#223f49]" />
        {isEditing ? (
          <ToolbarBtn icon="check" onClick={onStopEdit} title="Done editing" className="text-primary" />
        ) : (
          <ToolbarBtn icon="edit" onClick={onStartEdit} title="Edit block" />
        )}
        <ToolbarBtn icon="delete" onClick={onRemove} title="Remove block" className="hover:text-red-400" />
      </div>

      {/* Block content */}
      <div className="px-4 py-3" onClick={() => !isEditing && onStartEdit()}>
        {isEditing ? (
          <BlockEditor block={block} onUpdate={onUpdate} />
        ) : (
          <BlockPreview block={block} />
        )}
      </div>
    </div>
  )
}

function ToolbarBtn({
  icon,
  onClick,
  disabled,
  title,
  className = '',
}: {
  icon: string
  onClick: () => void
  disabled?: boolean
  title: string
  className?: string
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
  )
}

/* ─── Read-only block preview (same styling as ArticleContentBlocks) ──── */

function BlockPreview({ block }: { block: ArticleBlock }) {
  if (block.type === 'paragraph') {
    const hasContent = block.segments.some((s) => s.value.trim() !== '')
    if (!hasContent) return <p className="text-slate-500 italic text-lg">Empty paragraph — click to edit</p>
    return (
      <p className="text-lg text-slate-300 leading-relaxed">
        {block.segments.map((seg, i) =>
          seg.type === 'glossary' ? (
            <GlossaryTooltip key={i} term={seg.value}>{seg.value}</GlossaryTooltip>
          ) : (
            <span key={i}>{seg.value}</span>
          ),
        )}
      </p>
    )
  }

  if (block.type === 'blockquote') {
    if (!block.quote.trim()) return <p className="text-slate-500 italic">Empty blockquote — click to edit</p>
    return (
      <blockquote className="glass-panel p-6 rounded-xl border-l-4 border-primary not-italic">
        <p className="text-slate-200 text-base leading-relaxed mb-3">{block.quote}</p>
        {block.footer.trim() && <footer className="text-sm text-primary font-medium">{block.footer}</footer>}
      </blockquote>
    )
  }

  if (block.type === 'section') {
    if (!block.title.trim()) return <p className="text-slate-500 italic">Empty section — click to edit</p>
    return (
      <h2 className="text-2xl font-bold text-white">
        <span className="text-primary font-mono">{block.number}.</span> {block.title}
      </h2>
    )
  }

  if (block.type === 'list') {
    const items = block.items.filter((s) => s.trim() !== '')
    if (items.length === 0) return <p className="text-slate-500 italic">Empty list — click to edit</p>
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-slate-300">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'figure') {
    if (!block.imageUrl.trim()) return <p className="text-slate-500 italic">Empty figure — click to edit</p>
    return (
      <figure className="rounded-xl overflow-hidden border border-[#223f49]/50 max-w-[600px]">
        <img src={block.imageUrl} alt={block.alt ?? block.caption ?? ''} className="w-full h-auto max-h-[700px] object-contain" />
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

/* ─── Block editors ──────────────────────────────────────────────────────── */

function BlockEditor({ block, onUpdate }: { block: ArticleBlock; onUpdate: (b: ArticleBlock) => void }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphEditor block={block} onUpdate={onUpdate} />
    case 'blockquote':
      return <BlockquoteEditor block={block} onUpdate={onUpdate} />
    case 'section':
      return <SectionEditor block={block} onUpdate={onUpdate} />
    case 'list':
      return <ListEditor block={block} onUpdate={onUpdate} />
    case 'figure':
      return <FigureEditor block={block} onUpdate={onUpdate} />
    default:
      return null
  }
}

/* ---- Paragraph editor with glossary picker ---- */

function ParagraphEditor({ block, onUpdate }: { block: ArticleBlockParagraph; onUpdate: (b: ArticleBlock) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const [text, setText] = useState(() => segmentsToPlainText(block.segments))
  const [showGlossary, setShowGlossary] = useState(false)
  const [selRange, setSelRange] = useState<{ start: number; end: number } | null>(null)
  const { terms } = useGlossary()
  const [glossarySearch, setGlossarySearch] = useState('')

  useEffect(() => {
    onUpdateRef.current({ type: 'paragraph', segments: plainTextToSegments(text) })
  }, [text])

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [])

  useEffect(autoResize, [text, autoResize])

  const handleMarkGlossary = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    setSelRange({ start, end })
    setGlossarySearch(text.slice(start, end))
    setShowGlossary(true)
  }

  const applyGlossary = (termName: string) => {
    if (!selRange) return
    const before = text.slice(0, selRange.start)
    const after = text.slice(selRange.end)
    setText(`${before}[[${termName}]]${after}`)
    setShowGlossary(false)
    setSelRange(null)
  }

  const filteredTerms = useMemo(() => {
    if (!glossarySearch) return terms
    const q = glossarySearch.toLowerCase()
    return terms.filter((t) => t.term.toLowerCase().includes(q))
  }, [terms, glossarySearch])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Paragraph</span>
        <button
          onClick={handleMarkGlossary}
          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-primary bg-white/5 border border-[#223f49]/50 hover:border-primary/30 transition-all"
          title="Select text first, then click to link glossary term"
        >
          <span className="material-symbols-outlined text-[14px]">link</span>
          Link glossary
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent text-lg text-slate-300 leading-relaxed resize-none outline-none border-none focus:ring-0 p-0"
        rows={1}
        placeholder="Type paragraph text... Use [[Term Name]] for glossary links"
      />
      <p className="text-[10px] text-slate-500">Glossary terms are shown as [[Term Name]]. Select text and click "Link glossary" or type [[...]] manually.</p>

      {showGlossary && (
        <GlossaryPicker
          search={glossarySearch}
          onSearchChange={setGlossarySearch}
          terms={filteredTerms}
          onPick={applyGlossary}
          onClose={() => setShowGlossary(false)}
        />
      )}
    </div>
  )
}

function GlossaryPicker({
  search,
  onSearchChange,
  terms,
  onPick,
  onClose,
}: {
  search: string
  onSearchChange: (s: string) => void
  terms: { term: string; definition: string }[]
  onPick: (term: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="relative z-30 rounded-xl bg-[#15262d]/95 backdrop-blur-xl border border-primary/30 shadow-lg p-3 space-y-2 max-w-md">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="Search terms..."
          autoFocus
        />
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {terms.length === 0 && <p className="text-xs text-slate-500 py-2 text-center">No matching terms</p>}
        {terms.map((t) => (
          <button
            key={t.term}
            onClick={() => onPick(t.term)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <span className="text-sm text-white font-medium">{t.term}</span>
            <span className="block text-xs text-slate-400 line-clamp-1">{t.definition}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---- Blockquote editor ---- */

function BlockquoteEditor({ block, onUpdate }: { block: ArticleBlockBlockquote; onUpdate: (b: ArticleBlock) => void }) {
  return (
    <div className="glass-panel p-6 rounded-xl border-l-4 border-primary space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Blockquote</span>
      <textarea
        value={block.quote}
        onChange={(e) => onUpdate({ ...block, quote: e.target.value })}
        className="w-full bg-transparent text-slate-200 text-base leading-relaxed resize-none outline-none border-none focus:ring-0 p-0"
        rows={2}
        placeholder="Quote text..."
      />
      <input
        value={block.footer}
        onChange={(e) => onUpdate({ ...block, footer: e.target.value })}
        className="w-full bg-transparent text-sm text-primary font-medium outline-none border-none focus:ring-0 p-0 placeholder:text-primary/30"
        placeholder="— Attribution / footer"
      />
    </div>
  )
}

/* ---- Section editor ---- */

function SectionEditor({ block, onUpdate }: { block: ArticleBlockSection; onUpdate: (b: ArticleBlock) => void }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 shrink-0">Section</span>
      <input
        value={block.number}
        onChange={(e) => onUpdate({ ...block, number: e.target.value })}
        className="w-12 bg-transparent text-2xl font-bold text-primary font-mono outline-none border-none focus:ring-0 p-0 text-right"
        placeholder="#"
      />
      <span className="text-2xl font-bold text-primary">.</span>
      <input
        value={block.title}
        onChange={(e) => onUpdate({ ...block, title: e.target.value })}
        className="flex-1 bg-transparent text-2xl font-bold text-white outline-none border-none focus:ring-0 p-0 placeholder:text-slate-600"
        placeholder="Section title"
      />
    </div>
  )
}

/* ---- List editor ---- */

function ListEditor({ block, onUpdate }: { block: ArticleBlockList; onUpdate: (b: ArticleBlock) => void }) {
  const updateItem = (idx: number, val: string) => {
    const items = [...block.items]
    items[idx] = val
    onUpdate({ ...block, items })
  }

  const addItem = () => {
    onUpdate({ ...block, items: [...block.items, ''] })
  }

  const removeItem = (idx: number) => {
    onUpdate({ ...block, items: block.items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">List</span>
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-slate-300">
            <span className="material-symbols-outlined text-primary text-[18px] mt-2 shrink-0">check_circle</span>
            <input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 bg-transparent text-slate-300 leading-relaxed outline-none border-none focus:ring-0 p-0 placeholder:text-slate-600"
              placeholder="List item..."
            />
            <button
              onClick={() => removeItem(i)}
              className="text-slate-500 hover:text-red-400 mt-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">add</span>
        Add item
      </button>
    </div>
  )
}

/* ---- Figure editor ---- */

function FigureEditor({ block, onUpdate }: { block: ArticleBlockFigure; onUpdate: (b: ArticleBlock) => void }) {
  return (
    <div className="space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Figure</span>
      <input
        value={block.imageUrl}
        onChange={(e) => onUpdate({ ...block, imageUrl: e.target.value })}
        className="w-full bg-transparent text-sm text-slate-300 outline-none border-none focus:ring-0 p-0 placeholder:text-slate-600"
        placeholder="Image URL..."
      />
      {block.imageUrl.trim() && (
        <div className="rounded-xl overflow-hidden border border-[#223f49]/50">
          <img src={block.imageUrl} alt={block.alt ?? ''} className="w-full" />
        </div>
      )}
      <input
        value={block.caption}
        onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
        className="w-full bg-transparent text-sm text-slate-500 outline-none border-none focus:ring-0 p-0 placeholder:text-slate-600"
        placeholder="Caption..."
      />
      <input
        value={block.alt ?? ''}
        onChange={(e) => onUpdate({ ...block, alt: e.target.value })}
        className="w-full bg-transparent text-xs text-slate-600 outline-none border-none focus:ring-0 p-0 placeholder:text-slate-700"
        placeholder="Alt text (optional)..."
      />
    </div>
  )
}
