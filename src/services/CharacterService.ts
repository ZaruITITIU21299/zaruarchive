import { BaseService } from './BaseService'
import type { Character, CharacterDetail, RelatedCharacter, Tag } from '@/types'

export class CharacterService extends BaseService {
  async fetchAll(): Promise<Character[]> {
    const { data, error } = await this.db
      .from('characters')
      .select(`
        id, game_id, image_path, element, weapon, rarity, faction,
        display_order, is_featured,
        character_translations!inner (
          name, alias, title, summary, backstory
        )
      `)
      .eq('game_id', this.gameId)
      .eq('character_translations.lang', this.lang)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch characters: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapRow(row))
  }

  async fetchById(id: string): Promise<CharacterDetail | null> {
    const { data, error } = await this.db
      .from('characters')
      .select(`
        id, game_id, image_path, element, weapon, rarity, faction,
        display_order, is_featured,
        character_translations!inner (
          name, alias, title, summary, backstory
        )
      `)
      .eq('id', id)
      .eq('character_translations.lang', this.lang)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch character: ${error.message}`)
    if (!data) return null

    const base = this.mapRow(data as Record<string, unknown>)

    const [related, tags, attrs] = await Promise.all([
      this.fetchRelatedCharacters(id),
      this.fetchTags(id),
      this.fetchAttributes(id),
    ])

    return { ...base, attributes: attrs, relatedCharacters: related, tags }
  }

  private async fetchAttributes(characterId: string) {
    const { data, error } = await this.db
      .from('entity_attributes')
      .select(`
        definition_id, value_number, value_boolean, value_select,
        attribute_definitions!inner ( slug, data_type, display_order,
          attribute_definition_translations!inner ( label )
        ),
        entity_attribute_translations!inner ( value )
      `)
      .eq('entity_type', 'character')
      .eq('entity_id', characterId)
      .eq('attribute_definitions.game_id', this.gameId)
      .eq('attribute_definitions.attribute_definition_translations.lang', this.lang)
      .eq('entity_attribute_translations.lang', this.lang)

    if (error || !data) return []

    return (data as Array<Record<string, unknown>>)
      .map((row) => {
        const def = row.attribute_definitions as Record<string, unknown>
        const defTrans = (def.attribute_definition_translations as Array<Record<string, string>>)?.[0] ?? {}
        const valTrans = (row.entity_attribute_translations as Array<Record<string, string>>)?.[0] ?? {}
        const dataType = def.data_type as string

        let value: string | number | boolean | null = valTrans.value ?? null
        if (dataType === 'number') value = row.value_number as number | null
        if (dataType === 'boolean') value = row.value_boolean as boolean | null
        if (dataType === 'select') value = row.value_select as string | null

        return {
          definitionId: row.definition_id as string,
          slug: def.slug as string,
          label: defTrans.label ?? '',
          dataType: dataType as 'text' | 'number' | 'boolean' | 'select',
          value,
          _order: def.display_order as number,
        }
      })
      .sort((a, b) => a._order - b._order)
      .map(({ _order: _, ...rest }) => rest)
  }

  private async fetchRelatedCharacters(characterId: string): Promise<RelatedCharacter[]> {
    const { data, error } = await this.db
      .from('related_characters')
      .select(`
        relationship,
        character_b:characters!related_characters_character_b_fkey (
          id, image_path,
          character_translations!inner ( name )
        )
      `)
      .eq('character_a', characterId)
      .eq('character_b.character_translations.lang', this.lang)

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => {
      const b = row.character_b as Record<string, unknown> | null
      const trans = (b?.character_translations as Array<Record<string, string>>)?.[0]
      return {
        id: (b?.id as string) ?? '',
        name: trans?.name ?? '',
        imagePath: (b?.image_path as string) ?? null,
        relationship: row.relationship as string | null,
      }
    })
  }

  private async fetchTags(characterId: string): Promise<Tag[]> {
    const { data, error } = await this.db
      .from('content_tags')
      .select('tags ( id, game_id, slug, label )')
      .eq('entity_type', 'character')
      .eq('entity_id', characterId)

    if (error || !data) return []

    return data.map((row: Record<string, unknown>) => {
      const t = row.tags as Record<string, unknown>
      return {
        id: t.id as string,
        gameId: t.game_id as string,
        slug: t.slug as string,
        label: t.label as string,
      }
    })
  }

  private mapRow(row: Record<string, unknown>): Character {
    const trans = (row.character_translations as Array<Record<string, string>>)?.[0] ?? {}
    return {
      id: row.id as string,
      gameId: row.game_id as string,
      imagePath: (row.image_path as string) ?? null,
      element: (row.element as string) ?? null,
      weapon: (row.weapon as string) ?? null,
      rarity: (row.rarity as number) ?? null,
      faction: (row.faction as string) ?? null,
      displayOrder: (row.display_order as number) ?? 0,
      isFeatured: (row.is_featured as boolean) ?? false,
      name: trans.name ?? '',
      alias: trans.alias ?? '',
      title: trans.title ?? '',
      summary: trans.summary ?? '',
      backstory: trans.backstory ?? '',
      attributes: [],
    }
  }

  filterBySearch(characters: Character[], query: string): Character[] {
    if (!query) return characters
    const q = query.toLowerCase()
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.alias.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
    )
  }
}
