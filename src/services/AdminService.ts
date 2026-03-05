import { BaseService } from './BaseService'

interface TranslationPair {
  en: string
  vi: string
}

interface OptionalTranslationPair {
  en?: string
  vi?: string
}

// ─── Character ──────────────────────────────────────────────────────────────

export interface CharacterInput {
  image_path?: string | null
  element?: string | null
  weapon?: string | null
  rarity?: number | null
  faction?: string | null
  display_order?: number
  is_featured?: boolean
  name: TranslationPair
  alias?: OptionalTranslationPair
  title?: OptionalTranslationPair
  summary?: OptionalTranslationPair
  backstory?: OptionalTranslationPair
}

// ─── Timeline ───────────────────────────────────────────────────────────────

export interface TimelineInput {
  cover_path?: string | null
  display_order?: number
  parent_timeline_id?: number | null
  title: TranslationPair
  description?: OptionalTranslationPair
}

// ─── Event ──────────────────────────────────────────────────────────────────

export interface EventInput {
  timeline_id: number
  image_path?: string | null
  position?: number
  child_timeline_id?: number | null
  title: TranslationPair
  description?: OptionalTranslationPair
  time_label?: OptionalTranslationPair
}

// ─── Term ───────────────────────────────────────────────────────────────────

export interface TermInput {
  category?: string
  related_terms?: string[]
  display_order?: number
  term: TranslationPair
  definition: TranslationPair
}

// ─── Article ────────────────────────────────────────────────────────────────

export interface ArticleInput {
  section?: string
  image_path?: string | null
  read_time_min?: number | null
  is_featured?: boolean
  related_character_id?: string | null
  display_order?: number
  title: TranslationPair
  summary?: OptionalTranslationPair
  content?: OptionalTranslationPair
}

export class AdminService extends BaseService {

  private async getUserId(): Promise<string | null> {
    const { data } = await this.db.auth.getUser()
    return data.user?.id ?? null
  }

  // ─── Characters ─────────────────────────────────────────────────────────

  async createCharacter(input: CharacterInput): Promise<string> {
    const userId = await this.getUserId()

    const { data, error } = await this.db
      .from('characters')
      .insert({
        game_id: this.gameId,
        image_path: input.image_path ?? null,
        element: input.element ?? null,
        weapon: input.weapon ?? null,
        rarity: input.rarity ?? null,
        faction: input.faction ?? null,
        display_order: input.display_order ?? 0,
        is_featured: input.is_featured ?? false,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create character: ${error.message}`)

    const id = data.id as string
    await this.upsertTranslations('character_translations', 'character_id', id, input)
    return id
  }

  async updateCharacter(id: string, input: Partial<CharacterInput>): Promise<void> {
    const userId = await this.getUserId()

    const updates: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() }
    if (input.image_path !== undefined) updates.image_path = input.image_path
    if (input.element !== undefined) updates.element = input.element
    if (input.weapon !== undefined) updates.weapon = input.weapon
    if (input.rarity !== undefined) updates.rarity = input.rarity
    if (input.faction !== undefined) updates.faction = input.faction
    if (input.display_order !== undefined) updates.display_order = input.display_order
    if (input.is_featured !== undefined) updates.is_featured = input.is_featured

    const { error } = await this.db.from('characters').update(updates).eq('id', id)
    if (error) throw new Error(`Failed to update character: ${error.message}`)

    if (input.name || input.alias || input.title || input.summary || input.backstory) {
      await this.upsertTranslations('character_translations', 'character_id', id, input)
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.db
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`Failed to delete character: ${error.message}`)
  }

  // ─── Timelines ──────────────────────────────────────────────────────────

  async createTimeline(input: TimelineInput): Promise<string> {
    const userId = await this.getUserId()

    const { data, error } = await this.db
      .from('timelines')
      .insert({
        game_id: this.gameId,
        cover_path: input.cover_path ?? null,
        display_order: input.display_order ?? 0,
        parent_timeline_id: input.parent_timeline_id ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create timeline: ${error.message}`)

    const id = String(data.id)
    await this.upsertTimelineTranslations(id, input)
    return id
  }

  async updateTimeline(id: string, input: Partial<TimelineInput>): Promise<void> {
    const userId = await this.getUserId()

    const updates: Record<string, unknown> = { updated_by: userId }
    if (input.cover_path !== undefined) updates.cover_path = input.cover_path
    if (input.display_order !== undefined) updates.display_order = input.display_order
    if (input.parent_timeline_id !== undefined) updates.parent_timeline_id = input.parent_timeline_id

    const { error } = await this.db.from('timelines').update(updates).eq('id', Number(id))
    if (error) throw new Error(`Failed to update timeline: ${error.message}`)

    if (input.title || input.description) {
      await this.upsertTimelineTranslations(id, input)
    }
  }

  async deleteTimeline(id: string): Promise<void> {
    const { error } = await this.db
      .from('timelines')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', Number(id))
    if (error) throw new Error(`Failed to delete timeline: ${error.message}`)
  }

  // ─── Events ─────────────────────────────────────────────────────────────

  async createEvent(input: EventInput): Promise<string> {
    const userId = await this.getUserId()

    const { data, error } = await this.db
      .from('events')
      .insert({
        timeline_id: input.timeline_id,
        image_path: input.image_path ?? null,
        position: input.position ?? 0,
        child_timeline_id: input.child_timeline_id ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create event: ${error.message}`)

    const id = String(data.id)
    await this.upsertEventTranslations(id, input)
    return id
  }

  async updateEvent(id: string, input: Partial<EventInput>): Promise<void> {
    const userId = await this.getUserId()

    const updates: Record<string, unknown> = { updated_by: userId }
    if (input.image_path !== undefined) updates.image_path = input.image_path
    if (input.position !== undefined) updates.position = input.position
    if (input.child_timeline_id !== undefined) updates.child_timeline_id = input.child_timeline_id

    const { error } = await this.db.from('events').update(updates).eq('id', Number(id))
    if (error) throw new Error(`Failed to update event: ${error.message}`)

    if (input.title || input.description || input.time_label) {
      await this.upsertEventTranslations(id, input)
    }
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.db
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', Number(id))
    if (error) throw new Error(`Failed to delete event: ${error.message}`)
  }

  // ─── Terms ──────────────────────────────────────────────────────────────

  async createTerm(input: TermInput): Promise<string> {
    const userId = await this.getUserId()

    const { data, error } = await this.db
      .from('terms')
      .insert({
        game_id: this.gameId,
        category: input.category ?? 'general',
        related_terms: input.related_terms ?? [],
        display_order: input.display_order ?? 0,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create term: ${error.message}`)

    const id = data.id as string
    await this.upsertTermTranslations(id, input)
    return id
  }

  async updateTerm(id: string, input: Partial<TermInput>): Promise<void> {
    const userId = await this.getUserId()

    const updates: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() }
    if (input.category !== undefined) updates.category = input.category
    if (input.related_terms !== undefined) updates.related_terms = input.related_terms
    if (input.display_order !== undefined) updates.display_order = input.display_order

    const { error } = await this.db.from('terms').update(updates).eq('id', id)
    if (error) throw new Error(`Failed to update term: ${error.message}`)

    if (input.term || input.definition) {
      await this.upsertTermTranslations(id, input)
    }
  }

  async deleteTerm(id: string): Promise<void> {
    const { error } = await this.db
      .from('terms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`Failed to delete term: ${error.message}`)
  }

  // ─── Articles ───────────────────────────────────────────────────────────

  async createArticle(input: ArticleInput): Promise<string> {
    const userId = await this.getUserId()

    const { data, error } = await this.db
      .from('articles')
      .insert({
        game_id: this.gameId,
        section: input.section ?? 'theory',
        image_path: input.image_path ?? null,
        read_time_min: input.read_time_min ?? null,
        is_featured: input.is_featured ?? false,
        related_character_id: input.related_character_id ?? null,
        display_order: input.display_order ?? 0,
        published_at: new Date().toISOString(),
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create article: ${error.message}`)

    const id = data.id as string
    await this.upsertArticleTranslations(id, input)
    return id
  }

  async updateArticle(id: string, input: Partial<ArticleInput>): Promise<void> {
    const userId = await this.getUserId()

    const updates: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() }
    if (input.section !== undefined) updates.section = input.section
    if (input.image_path !== undefined) updates.image_path = input.image_path
    if (input.read_time_min !== undefined) updates.read_time_min = input.read_time_min
    if (input.is_featured !== undefined) updates.is_featured = input.is_featured
    if (input.related_character_id !== undefined) updates.related_character_id = input.related_character_id
    if (input.display_order !== undefined) updates.display_order = input.display_order

    const { error } = await this.db.from('articles').update(updates).eq('id', id)
    if (error) throw new Error(`Failed to update article: ${error.message}`)

    if (input.title || input.summary || input.content) {
      await this.upsertArticleTranslations(id, input)
    }
  }

  async deleteArticle(id: string): Promise<void> {
    const { error } = await this.db
      .from('articles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`Failed to delete article: ${error.message}`)
  }

  // ─── Entity Attributes (flexible per-game values) ───────────────────────

  async saveEntityAttributes(
    entityType: string,
    entityId: string,
    attributes: Array<{
      definition_id: string
      data_type: string
      text_en?: string
      text_vi?: string
      value_number?: number | null
      value_boolean?: boolean
      value_select?: string
    }>,
  ): Promise<void> {
    const { data: existing } = await this.db
      .from('entity_attributes')
      .select('id, definition_id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    const existingMap = new Map((existing ?? []).map(r => [r.definition_id as string, r.id as number]))

    for (const attr of attributes) {
      const existingId = existingMap.get(attr.definition_id)

      if (existingId) {
        const updates: Record<string, unknown> = {}
        if (attr.data_type === 'number') updates.value_number = attr.value_number ?? null
        if (attr.data_type === 'boolean') updates.value_boolean = attr.value_boolean ?? false
        if (attr.data_type === 'select') updates.value_select = attr.value_select ?? null

        await this.db.from('entity_attributes').update(updates).eq('id', existingId)

        if (attr.data_type === 'text') {
          for (const lang of ['en', 'vi'] as const) {
            const val = lang === 'en' ? (attr.text_en ?? '') : (attr.text_vi ?? '')
            const { data: trans } = await this.db
              .from('entity_attribute_translations')
              .select('id')
              .eq('attribute_id', existingId)
              .eq('lang', lang)
              .maybeSingle()

            if (trans) {
              await this.db.from('entity_attribute_translations').update({ value: val }).eq('id', trans.id)
            } else if (val) {
              await this.db.from('entity_attribute_translations').insert({
                attribute_id: existingId,
                lang,
                value: val,
              })
            }
          }
        }
      } else {
        const row: Record<string, unknown> = {
          definition_id: attr.definition_id,
          entity_type: entityType,
          entity_id: entityId,
        }
        if (attr.data_type === 'number') row.value_number = attr.value_number ?? null
        if (attr.data_type === 'boolean') row.value_boolean = attr.value_boolean ?? false
        if (attr.data_type === 'select') row.value_select = attr.value_select ?? null

        const { data: inserted, error } = await this.db
          .from('entity_attributes')
          .insert(row)
          .select('id')
          .single()

        if (error) throw new Error(`Failed to save attribute: ${error.message}`)

        if (attr.data_type === 'text') {
          const newId = inserted.id as number
          for (const lang of ['en', 'vi'] as const) {
            const val = lang === 'en' ? (attr.text_en ?? '') : (attr.text_vi ?? '')
            if (val) {
              await this.db.from('entity_attribute_translations').insert({
                attribute_id: newId,
                lang,
                value: val,
              })
            }
          }
        }
      }
    }
  }

  // ─── Attribute Definitions ───────────────────────────────────────────────

  async createAttributeDefinition(input: {
    entity_type: string
    slug: string
    data_type: string
    is_required?: boolean
    is_filterable?: boolean
    select_options?: string[] | null
    display_order?: number
    label_en: string
    label_vi?: string
    description_en?: string
    description_vi?: string
  }): Promise<string> {
    const { data, error } = await this.db
      .from('attribute_definitions')
      .insert({
        game_id: this.gameId,
        entity_type: input.entity_type,
        slug: input.slug,
        data_type: input.data_type,
        is_required: input.is_required ?? false,
        is_filterable: input.is_filterable ?? false,
        select_options: input.select_options ?? null,
        display_order: input.display_order ?? 0,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create attribute definition: ${error.message}`)

    const id = data.id as string

    for (const lang of ['en', 'vi'] as const) {
      const label = lang === 'en' ? input.label_en : (input.label_vi || input.label_en)
      const desc = lang === 'en' ? (input.description_en ?? '') : (input.description_vi ?? input.description_en ?? '')
      await this.db.from('attribute_definition_translations').insert({
        definition_id: id,
        lang,
        label,
        description: desc,
      })
    }

    return id
  }

  async updateAttributeDefinition(id: string, input: {
    slug?: string
    data_type?: string
    is_required?: boolean
    is_filterable?: boolean
    select_options?: string[] | null
    display_order?: number
    label_en?: string
    label_vi?: string
    description_en?: string
    description_vi?: string
  }): Promise<void> {
    const updates: Record<string, unknown> = {}
    if (input.slug !== undefined) updates.slug = input.slug
    if (input.data_type !== undefined) updates.data_type = input.data_type
    if (input.is_required !== undefined) updates.is_required = input.is_required
    if (input.is_filterable !== undefined) updates.is_filterable = input.is_filterable
    if (input.select_options !== undefined) updates.select_options = input.select_options
    if (input.display_order !== undefined) updates.display_order = input.display_order

    if (Object.keys(updates).length > 0) {
      const { error } = await this.db.from('attribute_definitions').update(updates).eq('id', id)
      if (error) throw new Error(`Failed to update attribute definition: ${error.message}`)
    }

    for (const lang of ['en', 'vi'] as const) {
      const label = lang === 'en' ? input.label_en : input.label_vi
      const desc = lang === 'en' ? input.description_en : input.description_vi
      if (label === undefined && desc === undefined) continue

      const row: Record<string, unknown> = {}
      if (label !== undefined) row.label = label
      if (desc !== undefined) row.description = desc

      const { data: existing } = await this.db
        .from('attribute_definition_translations')
        .select('id')
        .eq('definition_id', id)
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from('attribute_definition_translations').update(row).eq('id', existing.id)
      } else {
        await this.db.from('attribute_definition_translations').insert({
          definition_id: id,
          lang,
          label: label ?? '',
          description: desc ?? '',
        })
      }
    }
  }

  async deleteAttributeDefinition(id: string): Promise<void> {
    await this.db.from('entity_attribute_translations')
      .delete()
      .in('attribute_id',
        (await this.db.from('entity_attributes').select('id').eq('definition_id', id)).data?.map(r => r.id) ?? []
      )
    await this.db.from('entity_attributes').delete().eq('definition_id', id)
    await this.db.from('attribute_definition_translations').delete().eq('definition_id', id)
    const { error } = await this.db.from('attribute_definitions').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete attribute definition: ${error.message}`)
  }

  // ─── Tags ──────────────────────────────────────────────────────────────

  async fetchTags(): Promise<Array<{ id: string; slug: string; label: string }>> {
    const { data, error } = await this.db
      .from('tags')
      .select('id, slug, label')
      .eq('game_id', this.gameId)
      .order('label', { ascending: true })

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`)
    return (data ?? []).map(r => ({
      id: r.id as string,
      slug: r.slug as string,
      label: r.label as string,
    }))
  }

  async createTag(slug: string, label: string): Promise<string> {
    const { data, error } = await this.db
      .from('tags')
      .insert({ game_id: this.gameId, slug, label })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create tag: ${error.message}`)
    return data.id as string
  }

  async updateTag(id: string, slug: string, label: string): Promise<void> {
    const { error } = await this.db
      .from('tags')
      .update({ slug, label })
      .eq('id', id)

    if (error) throw new Error(`Failed to update tag: ${error.message}`)
  }

  async deleteTag(id: string): Promise<void> {
    await this.db.from('content_tags').delete().eq('tag_id', id)
    const { error } = await this.db.from('tags').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete tag: ${error.message}`)
  }

  async setEntityTags(entityType: string, entityId: string, tagIds: string[]): Promise<void> {
    await this.db
      .from('content_tags')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (tagIds.length > 0) {
      const rows = tagIds.map(tagId => ({
        tag_id: tagId,
        entity_type: entityType,
        entity_id: entityId,
      }))
      const { error } = await this.db.from('content_tags').insert(rows)
      if (error) throw new Error(`Failed to set tags: ${error.message}`)
    }
  }

  async getEntityTagIds(entityType: string, entityId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('content_tags')
      .select('tag_id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) return []
    return (data ?? []).map(r => r.tag_id as string)
  }

  // ─── Translation helpers ────────────────────────────────────────────────

  private async upsertTranslations(
    table: string,
    fkColumn: string,
    entityId: string,
    input: Partial<CharacterInput>,
  ) {
    for (const lang of ['en', 'vi'] as const) {
      const row: Record<string, unknown> = { [fkColumn]: entityId, lang }
      let hasFields = false

      if (input.name?.[lang]) { row.name = input.name[lang]; hasFields = true }
      if (input.alias?.[lang] !== undefined) { row.alias = input.alias[lang]; hasFields = true }
      if (input.title?.[lang] !== undefined) { row.title = input.title[lang]; hasFields = true }
      if (input.summary?.[lang] !== undefined) { row.summary = input.summary[lang]; hasFields = true }
      if (input.backstory?.[lang] !== undefined) { row.backstory = input.backstory[lang]; hasFields = true }

      if (!hasFields) continue

      const { data: existing } = await this.db
        .from(table)
        .select('id')
        .eq(fkColumn, entityId)
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from(table).update(row).eq('id', existing.id)
      } else {
        await this.db.from(table).insert(row)
      }
    }
  }

  private async upsertTimelineTranslations(entityId: string, input: Partial<TimelineInput>) {
    for (const lang of ['en', 'vi'] as const) {
      const row: Record<string, unknown> = { timeline_id: Number(entityId), lang }
      let hasFields = false

      if (input.title?.[lang]) { row.title = input.title[lang]; hasFields = true }
      if (input.description?.[lang] !== undefined) { row.description = input.description[lang]; hasFields = true }

      if (!hasFields) continue

      const { data: existing } = await this.db
        .from('timeline_translations')
        .select('id')
        .eq('timeline_id', Number(entityId))
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from('timeline_translations').update(row).eq('id', existing.id)
      } else {
        await this.db.from('timeline_translations').insert(row)
      }
    }
  }

  private async upsertEventTranslations(entityId: string, input: Partial<EventInput>) {
    for (const lang of ['en', 'vi'] as const) {
      const row: Record<string, unknown> = { event_id: Number(entityId), lang }
      let hasFields = false

      if (input.title?.[lang]) { row.title = input.title[lang]; hasFields = true }
      if (input.description?.[lang] !== undefined) { row.description = input.description[lang]; hasFields = true }
      if (input.time_label?.[lang] !== undefined) { row.time_label = input.time_label[lang]; hasFields = true }

      if (!hasFields) continue

      const { data: existing } = await this.db
        .from('event_translations')
        .select('id')
        .eq('event_id', Number(entityId))
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from('event_translations').update(row).eq('id', existing.id)
      } else {
        await this.db.from('event_translations').insert(row)
      }
    }
  }

  private async upsertTermTranslations(entityId: string, input: Partial<TermInput>) {
    for (const lang of ['en', 'vi'] as const) {
      const row: Record<string, unknown> = { term_id: entityId, lang }
      let hasFields = false

      if (input.term?.[lang]) { row.term = input.term[lang]; hasFields = true }
      if (input.definition?.[lang]) { row.definition = input.definition[lang]; hasFields = true }

      if (!hasFields) continue

      const { data: existing } = await this.db
        .from('term_translations')
        .select('id')
        .eq('term_id', entityId)
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from('term_translations').update(row).eq('id', existing.id)
      } else {
        await this.db.from('term_translations').insert(row)
      }
    }
  }

  private async upsertArticleTranslations(entityId: string, input: Partial<ArticleInput>) {
    for (const lang of ['en', 'vi'] as const) {
      const row: Record<string, unknown> = { article_id: entityId, lang }
      let hasFields = false

      if (input.title?.[lang]) { row.title = input.title[lang]; hasFields = true }
      if (input.summary?.[lang] !== undefined) { row.summary = input.summary[lang]; hasFields = true }
      if (input.content?.[lang] !== undefined) { row.content = input.content[lang]; hasFields = true }

      if (!hasFields) continue

      const { data: existing } = await this.db
        .from('article_translations')
        .select('id')
        .eq('article_id', entityId)
        .eq('lang', lang)
        .maybeSingle()

      if (existing) {
        await this.db.from('article_translations').update(row).eq('id', existing.id)
      } else {
        await this.db.from('article_translations').insert(row)
      }
    }
  }
}
