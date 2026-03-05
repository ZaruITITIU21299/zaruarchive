import { useState, useEffect, useRef, type FormEvent } from 'react'
import { ImageUpload } from '../ImageUpload'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AttributeService } from '@/services/AttributeService'
import { supabase } from '@/lib/supabase'
import type { Character, AttributeDefinition } from '@/types'

interface CharacterFormProps {
  character?: Character | null
  onSave: (data: CharacterFormData) => Promise<void>
  onCancel: () => void
}

export interface DynamicAttrValue {
  definition_id: string
  data_type: string
  text_en: string
  text_vi: string
  value_number: number | null
  value_boolean: boolean
  value_select: string
}

export interface CharacterFormData {
  name_en: string
  name_vi: string
  alias_en: string
  alias_vi: string
  title_en: string
  title_vi: string
  summary_en: string
  summary_vi: string
  backstory_en: string
  backstory_vi: string
  element: string
  weapon: string
  rarity: number | null
  faction: string
  image_path: string | null
  is_featured: boolean
  dynamicAttributes: DynamicAttrValue[]
}

const WUWA_ELEMENTS = [
  { value: 'Glacio', label: 'Glacio', icon: '/img/wuwa/Glacio_Icon.png' },
  { value: 'Fusion', label: 'Fusion', icon: '/img/wuwa/Fusion_Icon.png' },
  { value: 'Electro', label: 'Electro', icon: '/img/wuwa/Electro_Icon.png' },
  { value: 'Aero', label: 'Aero', icon: '/img/wuwa/Aero_Icon.png' },
  { value: 'Spectro', label: 'Spectro', icon: '/img/wuwa/Spectro_Icon.png' },
  { value: 'Havoc', label: 'Havoc', icon: '/img/wuwa/Havoc_Icon.png' },
  { value: 'Physical', label: 'Physical', icon: '/img/wuwa/Physical.webp' },
]

const WUWA_WEAPONS = ['Sword', 'Pistols', 'Gauntlets', 'Rectifier', 'Broadblade']

const RARITY_OPTIONS = [
  { value: 5, label: '5★' },
  { value: 4, label: '4★' },
  { value: 0, label: 'N/A' },
]

interface TagOption {
  id: string
  label: string
}

export function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const { gameId } = useGame()
  const { lang } = useLanguage()
  const isEdit = !!character
  const isWuwa = gameId === 'wuwa'

  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([])
  const [loadingDefs, setLoadingDefs] = useState(true)
  const [birthplaces, setBirthplaces] = useState<TagOption[]>([])
  const [affiliations, setAffiliations] = useState<TagOption[]>([])

  const [form, setForm] = useState<CharacterFormData>({
    name_en: character?.name ?? '',
    name_vi: '',
    alias_en: character?.alias ?? '',
    alias_vi: '',
    title_en: character?.title ?? '',
    title_vi: '',
    summary_en: character?.summary ?? '',
    summary_vi: '',
    backstory_en: character?.backstory ?? '',
    backstory_vi: '',
    element: character?.element ?? '',
    weapon: character?.weapon ?? '',
    rarity: character?.rarity ?? null,
    faction: character?.faction ?? '',
    image_path: character?.imagePath ?? null,
    is_featured: character?.isFeatured ?? false,
    dynamicAttributes: [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingDefs(true)
      try {
        const svc = new AttributeService(gameId, lang)
        const defs = await svc.fetchDefinitions('character')
        setDefinitions(defs)

        let existingValues: DynamicAttrValue[] = []
        if (character?.id) {
          const attrs = await svc.fetchEntityAttributes('character', character.id)
          existingValues = attrs.map(a => ({
            definition_id: a.definitionId,
            data_type: a.dataType,
            text_en: a.dataType === 'text' ? String(a.value ?? '') : '',
            text_vi: '',
            value_number: a.dataType === 'number' ? (a.value as number | null) : null,
            value_boolean: a.dataType === 'boolean' ? Boolean(a.value) : false,
            value_select: a.dataType === 'select' ? String(a.value ?? '') : '',
          }))
        }

        const attrValues: DynamicAttrValue[] = defs.map(def => {
          const existing = existingValues.find(v => v.definition_id === def.id)
          if (existing) return existing
          return {
            definition_id: def.id,
            data_type: def.dataType,
            text_en: '',
            text_vi: '',
            value_number: null,
            value_boolean: false,
            value_select: '',
          }
        })

        setForm(prev => ({ ...prev, dynamicAttributes: attrValues }))
      } catch {
        // Definitions may not exist yet
      } finally {
        setLoadingDefs(false)
      }
    }
    load()
  }, [gameId, lang, character?.id])

  useEffect(() => {
    const loadTaggedTerms = async (tagSlug: string, setter: (opts: TagOption[]) => void) => {
      const { data: tagRows } = await supabase
        .from('tags')
        .select('id')
        .eq('game_id', gameId)
        .eq('slug', tagSlug)

      if (!tagRows?.length) { setter([]); return }
      const tagId = tagRows[0].id as string

      const { data: links } = await supabase
        .from('content_tags')
        .select('entity_id')
        .eq('tag_id', tagId)
        .eq('entity_type', 'term')

      if (!links?.length) { setter([]); return }
      const termIds = links.map(l => l.entity_id as string)

      const { data: terms } = await supabase
        .from('term_translations')
        .select('term_id, term')
        .in('term_id', termIds)
        .eq('lang', lang)

      setter((terms ?? []).map(t => ({ id: t.term_id as string, label: t.term as string })))
    }

    loadTaggedTerms('place', setBirthplaces)
    loadTaggedTerms('organization', setAffiliations)
  }, [gameId, lang])

  const set = (field: keyof CharacterFormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const setAttr = (defId: string, patch: Partial<DynamicAttrValue>) => {
    setForm(prev => ({
      ...prev,
      dynamicAttributes: prev.dynamicAttributes.map(a =>
        a.definition_id === defId ? { ...a, ...patch } : a
      ),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name_en.trim()) {
      setError('English name is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave(form)
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
          {isEdit ? 'Edit Character' : 'Add Character'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <ImageUpload
          currentPath={form.image_path}
          storagePath={`${gameId}/characters`}
          onUpload={(path) => set('image_path', path)}
          className="mb-6"
        />

        {/* Bilingual name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Name (EN)" value={form.name_en} onChange={(v) => set('name_en', v)} required />
          <Field label="Name (VI)" value={form.name_vi} onChange={(v) => set('name_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Alias (EN)" value={form.alias_en} onChange={(v) => set('alias_en', v)} />
          <Field label="Alias (VI)" value={form.alias_vi} onChange={(v) => set('alias_vi', v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Title (EN)" value={form.title_en} onChange={(v) => set('title_en', v)} />
          <Field label="Title (VI)" value={form.title_vi} onChange={(v) => set('title_vi', v)} />
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Attribute (Element) — custom dropdown with icons */}
          {isWuwa ? (
            <AttributeDropdown
              label="Attribute"
              value={form.element}
              options={WUWA_ELEMENTS}
              onChange={(v) => set('element', v)}
            />
          ) : (
            <Field label="Element" value={form.element} onChange={(v) => set('element', v)} />
          )}

          {/* Weapon */}
          {isWuwa ? (
            <SelectDropdown
              label="Weapon"
              value={form.weapon}
              options={WUWA_WEAPONS.map(w => ({ value: w, label: w }))}
              onChange={(v) => set('weapon', v)}
            />
          ) : (
            <Field label="Weapon" value={form.weapon} onChange={(v) => set('weapon', v)} />
          )}

          {/* Rarity */}
          <SelectDropdown
            label="Rarity"
            value={form.rarity === 0 ? '0' : form.rarity?.toString() ?? ''}
            options={RARITY_OPTIONS.map(r => ({ value: String(r.value), label: r.label }))}
            onChange={(v) => set('rarity', v === '' ? null : Number(v))}
          />

          {/* Affiliation (Faction) */}
          {affiliations.length > 0 ? (
            <SelectDropdown
              label="Affiliation"
              value={form.faction}
              options={affiliations.map(a => ({ value: a.label, label: a.label }))}
              onChange={(v) => set('faction', v)}
            />
          ) : (
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Affiliation</span>
              <input
                type="text"
                value={form.faction}
                onChange={(e) => set('faction', e.target.value)}
                placeholder="No 'organization' tag terms yet"
                className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </label>
          )}
        </div>

        {/* Birthplace (from terms tagged "place") */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="block md:col-span-2">
            {birthplaces.length > 0 ? (
              <SelectDropdown
                label="Birthplace"
                value={form.dynamicAttributes.find(a => a.definition_id === '__birthplace')?.text_en ?? ''}
                options={birthplaces.map(p => ({ value: p.label, label: p.label }))}
                onChange={(val) => {
                  setForm(prev => {
                    const existing = prev.dynamicAttributes.find(a => a.definition_id === '__birthplace')
                    if (existing) {
                      return {
                        ...prev,
                        dynamicAttributes: prev.dynamicAttributes.map(a =>
                          a.definition_id === '__birthplace' ? { ...a, text_en: val } : a
                        ),
                      }
                    }
                    return {
                      ...prev,
                      dynamicAttributes: [
                        ...prev.dynamicAttributes,
                        { definition_id: '__birthplace', data_type: 'text', text_en: val, text_vi: '', value_number: null, value_boolean: false, value_select: '' },
                      ],
                    }
                  })
                }}
              />
            ) : (
              <>
                <span className="text-xs text-slate-400 mb-1 block">Birthplace</span>
                <div className="px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-slate-500 text-sm">
                  No terms tagged "place" yet. Add terms with a "place" tag first.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Summary (EN)" value={form.summary_en} onChange={(v) => set('summary_en', v)} rows={3} />
          <TextArea label="Summary (VI)" value={form.summary_vi} onChange={(v) => set('summary_vi', v)} rows={3} />
        </div>

        {/* Backstory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TextArea label="Backstory (EN)" value={form.backstory_en} onChange={(v) => set('backstory_en', v)} rows={4} />
          <TextArea label="Backstory (VI)" value={form.backstory_vi} onChange={(v) => set('backstory_vi', v)} rows={4} />
        </div>

        {/* Dynamic attribute fields from database */}
        {!loadingDefs && definitions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              <span className="text-sm font-medium text-slate-300">Game Attributes</span>
              <span className="text-xs text-slate-500">({definitions.length})</span>
            </div>

            <div className="space-y-4">
              {definitions.map((def) => {
                const attrVal = form.dynamicAttributes.find(a => a.definition_id === def.id)
                if (!attrVal) return null

                return (
                  <DynamicField
                    key={def.id}
                    definition={def}
                    value={attrVal}
                    onChange={(patch) => setAttr(def.id, patch)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {loadingDefs && (
          <div className="mb-4 text-xs text-slate-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Loading attribute definitions...
          </div>
        )}

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => set('is_featured', e.target.checked)}
            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-slate-300">Featured character</span>
        </label>

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

function SelectDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = '— Select —',
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  return (
    <div ref={ref} className="block relative">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-left text-sm text-white hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-slate-500'}>{selected ? selected.label : placeholder}</span>
        <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] max-h-64 overflow-y-auto rounded-xl bg-surface-dark border border-white/10 shadow-xl py-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                value === opt.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AttributeDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string; icon: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  return (
    <div ref={ref} className="block relative">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-left text-sm text-white hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
      >
        {selected ? (
          <>
            <img src={selected.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
            <span>{selected.label}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">auto_awesome</span>
            <span className="text-slate-500">— Select —</span>
          </>
        )}
        <span className="ml-auto material-symbols-outlined text-slate-400 text-[18px] shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] max-h-64 overflow-y-auto rounded-xl bg-surface-dark border border-white/10 shadow-xl py-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </span>
            — Select —
          </button>
          {options.map(el => (
            <button
              key={el.value}
              type="button"
              onClick={() => { onChange(el.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                value === el.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <img src={el.icon} alt="" className="w-5 h-5 object-contain shrink-0" />
              {el.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DynamicField({
  definition,
  value,
  onChange,
}: {
  definition: AttributeDefinition
  value: DynamicAttrValue
  onChange: (patch: Partial<DynamicAttrValue>) => void
}) {
  const required = definition.isRequired

  switch (definition.dataType) {
    case 'text':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={`${definition.label} (EN)`}
            value={value.text_en}
            onChange={(v) => onChange({ text_en: v })}
            required={required}
          />
          <Field
            label={`${definition.label} (VI)`}
            value={value.text_vi}
            onChange={(v) => onChange({ text_vi: v })}
          />
        </div>
      )

    case 'number':
      return (
        <div className="max-w-xs">
          <Field
            label={definition.label}
            value={value.value_number?.toString() ?? ''}
            onChange={(v) => onChange({ value_number: v ? Number(v) : null })}
            type="number"
            required={required}
          />
        </div>
      )

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.value_boolean}
            onChange={(e) => onChange({ value_boolean: e.target.checked })}
            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-slate-300">{definition.label}</span>
          {definition.description && (
            <span className="text-xs text-slate-500">({definition.description})</span>
          )}
        </label>
      )

    case 'select':
      return (
        <div className="max-w-xs">
          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">{definition.label}</span>
            <select
              value={value.value_select}
              onChange={(e) => onChange({ value_select: e.target.value })}
              required={required}
              className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="">— Select —</option>
              {(definition.selectOptions ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>
      )

    default:
      return null
  }
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
