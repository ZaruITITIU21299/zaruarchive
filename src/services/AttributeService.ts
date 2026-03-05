import { BaseService } from './BaseService'
import type { AttributeDefinition, EntityAttribute, GameSection, ContentEntityType } from '@/types'

export class AttributeService extends BaseService {

  async fetchDefinitions(entityType: ContentEntityType): Promise<AttributeDefinition[]> {
    const { data, error } = await this.db
      .from('attribute_definitions')
      .select(`
        id, game_id, entity_type, slug, data_type,
        is_required, is_filterable, select_options, display_order,
        attribute_definition_translations!inner ( label, description )
      `)
      .eq('game_id', this.gameId)
      .eq('entity_type', entityType)
      .eq('attribute_definition_translations.lang', this.lang)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch attribute definitions: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => {
      const trans = (row.attribute_definition_translations as Array<Record<string, string>>)?.[0] ?? {}
      return {
        id: row.id as string,
        gameId: row.game_id as string,
        entityType: row.entity_type as ContentEntityType,
        slug: row.slug as string,
        dataType: row.data_type as AttributeDefinition['dataType'],
        isRequired: row.is_required as boolean,
        isFilterable: row.is_filterable as boolean,
        selectOptions: row.select_options as string[] | null,
        displayOrder: row.display_order as number,
        label: trans.label ?? '',
        description: trans.description ?? '',
      }
    })
  }

  async fetchEntityAttributes(
    entityType: ContentEntityType,
    entityId: string,
  ): Promise<EntityAttribute[]> {
    const { data, error } = await this.db
      .from('entity_attributes')
      .select(`
        id, definition_id, value_number, value_boolean, value_select,
        attribute_definitions!inner ( slug, data_type, display_order,
          attribute_definition_translations!inner ( label )
        ),
        entity_attribute_translations!inner ( value )
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('attribute_definitions.game_id', this.gameId)
      .eq('attribute_definitions.attribute_definition_translations.lang', this.lang)
      .eq('entity_attribute_translations.lang', this.lang)

    if (error) throw new Error(`Failed to fetch entity attributes: ${error.message}`)

    return (data ?? [])
      .map((row: Record<string, unknown>) => {
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
          dataType: dataType as EntityAttribute['dataType'],
          value,
          _order: def.display_order as number,
        }
      })
      .sort((a, b) => (a._order ?? 0) - (b._order ?? 0))
      .map(({ _order: _, ...rest }) => rest)
  }

  async fetchBatchEntityAttributes(
    entityType: ContentEntityType,
    entityIds: string[],
  ): Promise<Map<string, EntityAttribute[]>> {
    if (entityIds.length === 0) return new Map()

    const { data, error } = await this.db
      .from('entity_attributes')
      .select(`
        id, definition_id, entity_id, value_number, value_boolean, value_select,
        attribute_definitions!inner ( slug, data_type, display_order,
          attribute_definition_translations!inner ( label )
        ),
        entity_attribute_translations!inner ( value )
      `)
      .eq('entity_type', entityType)
      .in('entity_id', entityIds)
      .eq('attribute_definitions.game_id', this.gameId)
      .eq('attribute_definitions.attribute_definition_translations.lang', this.lang)
      .eq('entity_attribute_translations.lang', this.lang)

    if (error) throw new Error(`Failed to batch fetch attributes: ${error.message}`)

    const result = new Map<string, EntityAttribute[]>()
    for (const id of entityIds) result.set(id, [])

    for (const row of data ?? []) {
      const r = row as Record<string, unknown>
      const entityId = r.entity_id as string
      const def = r.attribute_definitions as Record<string, unknown>
      const defTrans = (def.attribute_definition_translations as Array<Record<string, string>>)?.[0] ?? {}
      const valTrans = (r.entity_attribute_translations as Array<Record<string, string>>)?.[0] ?? {}
      const dataType = def.data_type as string

      let value: string | number | boolean | null = valTrans.value ?? null
      if (dataType === 'number') value = r.value_number as number | null
      if (dataType === 'boolean') value = r.value_boolean as boolean | null
      if (dataType === 'select') value = r.value_select as string | null

      const arr = result.get(entityId) ?? []
      arr.push({
        definitionId: r.definition_id as string,
        slug: def.slug as string,
        label: defTrans.label ?? '',
        dataType: dataType as EntityAttribute['dataType'],
        value,
      })
      result.set(entityId, arr)
    }

    return result
  }

  async fetchSections(entityType: 'article' | 'term'): Promise<GameSection[]> {
    const { data, error } = await this.db
      .from('game_sections')
      .select(`
        id, game_id, entity_type, slug, icon, display_order,
        game_section_translations!inner ( label, description )
      `)
      .eq('game_id', this.gameId)
      .eq('entity_type', entityType)
      .eq('game_section_translations.lang', this.lang)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch sections: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => {
      const trans = (row.game_section_translations as Array<Record<string, string>>)?.[0] ?? {}
      return {
        id: String(row.id),
        gameId: row.game_id as string,
        entityType: row.entity_type as 'article' | 'term',
        slug: row.slug as string,
        icon: (row.icon as string) ?? null,
        displayOrder: row.display_order as number,
        label: trans.label ?? '',
        description: trans.description ?? '',
      }
    })
  }
}
