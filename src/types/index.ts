// =============================================================================
// Domain types — mirrors the database schema
// =============================================================================

export interface Game {
  id: string
  name: string
  slug: string
  icon: string | null
  isActive: boolean
}

// ─── Flexible Attributes ───────────────────────────────────────────────────

export type AttributeDataType = 'text' | 'number' | 'boolean' | 'select'

export interface AttributeDefinition {
  id: string
  gameId: string
  entityType: ContentEntityType
  slug: string
  dataType: AttributeDataType
  isRequired: boolean
  isFilterable: boolean
  selectOptions: string[] | null
  displayOrder: number
  label: string
  description: string
}

export interface EntityAttribute {
  definitionId: string
  slug: string
  label: string
  dataType: AttributeDataType
  value: string | number | boolean | null
}

// ─── Game Sections (per-game article sections & term categories) ───────────

export interface GameSection {
  id: string
  gameId: string
  entityType: 'article' | 'term'
  slug: string
  icon: string | null
  displayOrder: number
  label: string
  description: string
}

// ─── Characters ─────────────────────────────────────────────────────────────

export interface Character {
  id: string
  gameId: string
  imagePath: string | null
  element: string | null
  weapon: string | null
  rarity: number | null
  faction: string | null
  displayOrder: number
  isFeatured: boolean
  name: string
  alias: string
  title: string
  summary: string
  backstory: string
  attributes: EntityAttribute[]
}

export interface CharacterDetail extends Character {
  relatedCharacters: RelatedCharacter[]
  tags: Tag[]
}

export interface RelatedCharacter {
  id: string
  name: string
  imagePath: string | null
  relationship: string | null
}

// ─── Timelines ──────────────────────────────────────────────────────────────

export interface Timeline {
  id: string
  gameId: string
  coverPath: string | null
  displayOrder: number
  parentTimelineId: string | null
  title: string
  description: string
  events: TimelineEvent[]
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  timeLabel: string
  imagePath: string | null
  position: number
  childTimelineId: string | null
}

// ─── Terminology ────────────────────────────────────────────────────────────

export interface Term {
  id: string
  gameId: string
  category: string
  relatedTerms: string[]
  displayOrder: number
  term: string
  definition: string
  attributes: EntityAttribute[]
}

// ─── Articles ───────────────────────────────────────────────────────────────

export interface Article {
  id: string
  gameId: string
  section: string
  imagePath: string | null
  readTimeMin: number | null
  isFeatured: boolean
  relatedCharacterId: string | null
  publishedAt: string | null
  title: string
  summary: string
  content: string
  attributes: EntityAttribute[]
}

export interface ArticleListItem {
  id: string
  gameId: string
  section: string
  imagePath: string | null
  readTimeMin: number | null
  isFeatured: boolean
  publishedAt: string | null
  title: string
  summary: string
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export interface Tag {
  id: string
  gameId: string
  slug: string
  label: string
}

export type ContentEntityType = 'character' | 'event' | 'article' | 'term' | 'timeline'
