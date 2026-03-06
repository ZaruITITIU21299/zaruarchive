import { useState, useEffect, type FormEvent } from 'react'
import { ImageUpload } from '../ImageUpload'
import { useGame } from '@/contexts/GameContext'
import type { ArticleBlock } from '@/types'
import { parseArticleContent, serializeArticleContent } from '@/utils/articleContent'

export interface ArticleFormArticle {
  id: string
  title: string
  summary: string
  content?: string
  title_vi?: string
  summary_vi?: string
  content_en?: string
  content_vi?: string
  imagePath: string | null
  section: string
  readTimeMin: number | null
  isFeatured: boolean
}

interface ArticleFormProps {
  article?: ArticleFormArticle | null
  defaultSection?: string
  onSave: (data: ArticleFormData) => Promise<void>
  onCancel: () => void
}

export interface ArticleFormData {
  title_en: string
  title_vi: string
  summary_en: string
  summary_vi: string
  content_en: string
  content_vi: string
  section: string
  image_path: string | null
  read_time_min: number | null
  is_featured: boolean
}

export function ArticleForm({ article, defaultSection = 'theory', onSave, onCancel }: ArticleFormProps) {
  const { gameId } = useGame()
  const isEdit = !!article

  const [form, setForm] = useState<ArticleFormData>({
    title_en: article?.title ?? '',
    title_vi: article?.title_vi ?? '',
    summary_en: article?.summary ?? '',
    summary_vi: article?.summary_vi ?? '',
    content_en: '',
    content_vi: '',
    section: article?.section ?? defaultSection,
    image_path: article?.imagePath ?? null,
    read_time_min: article?.readTimeMin ?? null,
    is_featured: article?.isFeatured ?? false,
  })

  const [blocksEn, setBlocksEn] = useState<ArticleBlock[]>(() =>
    parseArticleContent(article?.content_en ?? article?.content))
  const [blocksVi, setBlocksVi] = useState<ArticleBlock[]>(() =>
    parseArticleContent(article?.content_vi))

  useEffect(() => {
    if (article) {
      setBlocksEn(parseArticleContent(article.content_en ?? article.content))
      setBlocksVi(parseArticleContent(article.content_vi))
    } else {
      setBlocksEn([])
      setBlocksVi([])
    }
  }, [article?.id, article?.content_en, article?.content_vi, article?.content])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentTab, setContentTab] = useState<'en' | 'vi'>('en')

  const set = (field: keyof ArticleFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title_en.trim()) {
      setError('English title is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({
        ...form,
        content_en: serializeArticleContent(blocksEn),
        content_vi: serializeArticleContent(blocksVi),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-4xl mx-4 bg-surface-dark border border-glass-border rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-white mb-6 font-[--font-display]">
          {isEdit ? 'Edit Article' : 'Add Article'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <ImageUpload
          currentPath={form.image_path}
          storagePath={`${gameId}/articles`}
          onUpload={(path) => set('image_path', path)}
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Title (EN)" value={form.title_en} onChange={(v) => set('title_en', v)} required />
          <Field label="Title (VI)" value={form.title_vi} onChange={(v) => set('title_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Summary (EN)" value={form.summary_en} onChange={(v) => set('summary_en', v)} rows={3} />
          <TextArea label="Summary (VI)" value={form.summary_vi} onChange={(v) => set('summary_vi', v)} rows={3} />
        </div>

        <ContentBlocksEditor
          blocksEn={blocksEn}
          blocksVi={blocksVi}
          contentTab={contentTab}
          onTabChange={setContentTab}
          onBlocksEnChange={setBlocksEn}
          onBlocksViChange={setBlocksVi}
        />

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">Section</span>
            <select
              value={form.section}
              onChange={(e) => set('section', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="theory">Theory</option>
              <option value="lore">Lore</option>
              <option value="article">Article</option>
            </select>
          </label>
          <Field
            label="Read Time (min)"
            value={form.read_time_min?.toString() ?? ''}
            onChange={(v) => set('read_time_min', v ? Number(v) : null)}
            type="number"
          />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set('is_featured', e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-slate-300">Featured</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Default block factories ───────────────────────────────────────────────

function createParagraphBlock(): ArticleBlock {
  return { type: 'paragraph', segments: [{ type: 'text', value: '' }] }
}
function createBlockquoteBlock(): ArticleBlock {
  return { type: 'blockquote', quote: '', footer: '' }
}
function createSectionBlock(): ArticleBlock {
  return { type: 'section', number: '01', title: '' }
}
function createListBlock(): ArticleBlock {
  return { type: 'list', items: [''] }
}
function createFigureBlock(): ArticleBlock {
  return { type: 'figure', imageUrl: '', caption: '' }
}

const BLOCK_LABELS: Record<ArticleBlock['type'], string> = {
  paragraph: 'Paragraph',
  blockquote: 'Blockquote',
  section: 'Section heading',
  list: 'List',
  figure: 'Figure',
}

// ─── Content blocks editor ────────────────────────────────────────────────

function ContentBlocksEditor({
  blocksEn,
  blocksVi,
  contentTab,
  onTabChange,
  onBlocksEnChange,
  onBlocksViChange,
}: {
  blocksEn: ArticleBlock[]
  blocksVi: ArticleBlock[]
  contentTab: 'en' | 'vi'
  onTabChange: (tab: 'en' | 'vi') => void
  onBlocksEnChange: (blocks: ArticleBlock[]) => void
  onBlocksViChange: (blocks: ArticleBlock[]) => void
}) {
  const blocks = contentTab === 'en' ? blocksEn : blocksVi
  const setBlocks = contentTab === 'en' ? onBlocksEnChange : onBlocksViChange

  const addBlock = (kind: ArticleBlock['type']) => {
    const factory = {
      paragraph: createParagraphBlock,
      blockquote: createBlockquoteBlock,
      section: createSectionBlock,
      list: createListBlock,
      figure: createFigureBlock,
    }[kind]
    setBlocks([...blocks, factory()])
  }

  const updateBlock = (index: number, block: ArticleBlock) => {
    const next = [...blocks]
    next[index] = block
    setBlocks(next)
  }

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const next = [...blocks]
    const j = dir === 'up' ? index - 1 : index + 1
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setBlocks(next)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs text-slate-400">Content blocks</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => onTabChange('en')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${contentTab === 'en' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onTabChange('vi')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${contentTab === 'vi' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              VI
            </button>
          </div>
          <select
            value=""
            onChange={(e) => { const v = e.target.value as ArticleBlock['type']; if (v) addBlock(v); e.target.value = '' }}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="">Add block...</option>
            {(['paragraph', 'blockquote', 'section', 'list', 'figure'] as const).map((t) => (
              <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/5 py-8 text-center text-slate-500 text-sm">
            No blocks. Use &quot;Add block...&quot; to add content.
          </div>
        ) : (
          blocks.map((block, index) => (
            <BlockCard
              key={index}
              block={block}
              index={index}
              total={blocks.length}
              onChange={(b) => updateBlock(index, b)}
              onRemove={() => removeBlock(index)}
              onMoveUp={() => moveBlock(index, 'up')}
              onMoveDown={() => moveBlock(index, 'down')}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: ArticleBlock
  index: number
  total: number
  onChange: (block: ArticleBlock) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const base = 'rounded-xl border border-white/10 bg-white/5 p-4'
  return (
    <div className={base}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30" title="Move up">
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30" title="Move down">
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
          <button type="button" onClick={onRemove} className="p-1.5 rounded text-red-400 hover:bg-red-500/20" title="Remove">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <BlockEditor block={block} onChange={onChange} />
    </div>
  )
}

function BlockEditor({ block, onChange }: { block: ArticleBlock; onChange: (b: ArticleBlock) => void }) {
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30'

  if (block.type === 'paragraph') {
    return (
      <div className="space-y-2">
        {block.segments.map((seg, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={seg.type}
              onChange={(e) => {
                const next = [...block.segments]
                next[i] = { type: e.target.value as 'text' | 'glossary', value: seg.value }
                onChange({ ...block, segments: next })
              }}
              className="w-28 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="text">Text</option>
              <option value="glossary">Glossary term</option>
            </select>
            <input
              type="text"
              value={seg.value}
              onChange={(e) => {
                const next = [...block.segments]
                next[i] = { ...seg, value: e.target.value }
                onChange({ ...block, segments: next })
              }}
              placeholder={seg.type === 'glossary' ? 'e.g. Sector 7' : 'Text...'}
              className={inputClass + ' flex-1'}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...block, segments: [...block.segments, { type: 'text', value: '' }] })}
          className="text-xs text-primary hover:underline"
        >
          + Add segment
        </button>
      </div>
    )
  }

  if (block.type === 'blockquote') {
    return (
      <div className="space-y-2">
        <textarea
          value={block.quote}
          onChange={(e) => onChange({ ...block, quote: e.target.value })}
          placeholder="Quote text..."
          rows={2}
          className={inputClass + ' resize-none'}
        />
        <input
          type="text"
          value={block.footer}
          onChange={(e) => onChange({ ...block, footer: e.target.value })}
          placeholder="— Attribution (e.g. Dr. Elara Voss)"
          className={inputClass}
        />
      </div>
    )
  }

  if (block.type === 'section') {
    return (
      <div className="grid grid-cols-4 gap-2">
        <input
          type="text"
          value={block.number}
          onChange={(e) => onChange({ ...block, number: e.target.value })}
          placeholder="01"
          className={inputClass}
        />
        <input
          type="text"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Section title"
          className={inputClass + ' col-span-3'}
        />
      </div>
    )
  }

  if (block.type === 'list') {
    return (
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...block.items]
                next[i] = e.target.value
                onChange({ ...block, items: next })
              }}
              placeholder={`Item ${i + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
              className="p-2 rounded text-red-400 hover:bg-red-500/20 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...block, items: [...block.items, ''] })}
          className="text-xs text-primary hover:underline"
        >
          + Add item
        </button>
      </div>
    )
  }

  if (block.type === 'figure') {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.imageUrl}
          onChange={(e) => onChange({ ...block, imageUrl: e.target.value })}
          placeholder="Image URL"
          className={inputClass}
        />
        <input
          type="text"
          value={block.alt ?? ''}
          onChange={(e) => onChange({ ...block, alt: e.target.value || undefined })}
          placeholder="Alt text (optional)"
          className={inputClass}
        />
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Caption"
          className={inputClass}
        />
      </div>
    )
  }

  return null
}

function Field({
  label, value, onChange, required, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
      />
    </label>
  )
}

function TextArea({
  label, value, onChange, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
      />
    </label>
  )
}
