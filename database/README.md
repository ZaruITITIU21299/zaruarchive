# Zaru Archive — Database Design

## Entity Relationship Overview

```
games (1)─────────┬──(N) characters ──(N) character_translations
                   │         │
                   │         ├──(N) character_events ──(N) events
                   │         │
                   │         └──(N) related_characters
                   │
                   ├──(N) timelines ──(N) timeline_translations
                   │         │
                   │         ├──(N) events ──(N) event_translations
                   │         │        │
                   │         │        └── child_timeline_id → timelines
                   │         │
                   │         └── parent_timeline_id → timelines
                   │
                   ├──(N) terms ──(N) term_translations
                   │
                   ├──(N) articles ──(N) article_translations
                   │         │
                   │         └── related_character_id → characters
                   │
                   ├──(N) tags ──(N) content_tags ──→ any entity
                   │
                   ├──(N) game_sections ──(N) game_section_translations
                   │
                   └──(N) attribute_definitions ──(N) attr_def_translations
                                    │
                                    └──(N) entity_attributes ──(N) entity_attr_translations
```

## Design Decisions

### 1. Multi-Game via `game_id`

Every content table has a `game_id` FK pointing to `games`. This is the partition key that isolates content between games. The `games` table uses **text IDs** (`'wuwa'`, `'endfield'`) for readability.

### 2. Unified Translation Pattern

Separate `*_translations` tables with `(entity_id, lang)` unique constraint. Adding Japanese is just inserting rows, no schema changes.

### 3. Supabase Storage for Images

Single bucket `game-assets` (public). DB stores only the path: `wuwa/characters/abc123.webp`. App generates full URL via `supabase.storage.from('game-assets').getPublicUrl(path)`.

### 4. Child/Sub-Timelines

Events can link to child timelines via `child_timeline_id`. When a user taps a "big node" (e.g., "Rinascita Established"), the event popup shows a "View Sub-Timeline" button that navigates to `/timeline/{childTimelineId}`.

Child timelines also have `parent_timeline_id` for easy "Back to Parent" navigation.

**Flow:**
1. Main timeline shows era-level nodes
2. An event has `child_timeline_id` set → UI shows "Has Sub-Timeline" badge
3. User clicks → navigates to `/timeline/{childId}`
4. Child timeline has `parent_timeline_id` → UI shows "Back to Parent" breadcrumb

### 5. Per-Game Flexible Attributes

**Problem:** WuWa characters have "Forte" but Endfield characters have "Race", "Class", "Originium Arts". Adding a field to one game should not affect others.

**Solution:** Three-table system:

| Table | Purpose |
|-------|---------|
| `attribute_definitions` | Defines available attributes per game + entity type |
| `attribute_definition_translations` | i18n labels for attribute names |
| `entity_attributes` | Stores actual values on specific entities |
| `entity_attribute_translations` | i18n for text values |

**Example — WuWa character attributes:**
```
attribute_definitions:
  { game: 'wuwa', entity_type: 'character', slug: 'forte', data_type: 'text' }
  { game: 'wuwa', entity_type: 'character', slug: 'birthplace', data_type: 'text' }

entity_attributes:
  { definition: 'forte', entity_id: '<char-uuid>', value: 'Resonance Liberation...' }
```

**Example — Endfield character attributes:**
```
attribute_definitions:
  { game: 'endfield', entity_type: 'character', slug: 'race', data_type: 'select' }
  { game: 'endfield', entity_type: 'character', slug: 'class', data_type: 'select' }
  { game: 'endfield', entity_type: 'character', slug: 'originium_arts', data_type: 'text' }
```

Adding a new attribute is just an INSERT into `attribute_definitions` — no schema changes, no impact on other games.

### 6. Per-Game Sections & Categories

**Problem:** Article sections and term categories differ between games. WuWa has "Event Log", Endfield has "Field Report".

**Solution:** `game_sections` table replaces hardcoded CHECK constraints.

| Game | Article Sections |
|------|-----------------|
| WuWa | theory, lore, guide, event_log, character_study |
| Endfield | theory, lore, guide, field_report, intelligence_brief |

| Game | Term Categories |
|------|----------------|
| WuWa | technology, medical, location, species, law, faction, event, general |
| Endfield | originium, technology, location, race, faction, general |

### 7. Polymorphic Tags

`content_tags` uses `entity_type` + `entity_id` to link a tag to any content row. Tags are game-scoped.

### 8. Standard Audit Columns

Every content table includes `status`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Base schema (tables, indexes, triggers, seed data) |
| `002_flexible_attributes.sql` | Migration: flexible attributes, game sections, child timeline improvements |

## Storage Bucket Setup

Create via Supabase Dashboard → Storage → New Bucket:

- **Name:** `game-assets`
- **Public:** Yes
- **Allowed MIME types:** `image/webp, image/png, image/jpeg`
- **Max file size:** 5 MB

Add a storage policy for public read:
```sql
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-assets');
```

## Query Examples

### Characters with game-specific attributes
```ts
// Fetch characters (shared fields)
const chars = await characterService.fetchAll()

// Fetch attribute definitions for this game
const defs = await attributeService.fetchDefinitions('character')
// Returns: [{ slug: 'forte', label: 'Forte', ... }] for WuWa
//          [{ slug: 'race', label: 'Race', ... }] for Endfield

// Fetch a character detail (includes flexible attributes)
const detail = await characterService.fetchById(id)
// detail.attributes = [{ slug: 'forte', label: 'Forte', value: '...' }]
```

### Timeline with child navigation
```ts
const timeline = await timelineService.fetchById(id)

// Check if timeline is a child
if (timeline.parentTimelineId) {
  // Show "Back to parent" button
}

// Check events for sub-timelines
for (const event of timeline.events) {
  if (event.childTimelineId) {
    // Show "View Sub-Timeline" button
    // Navigate to /timeline/${event.childTimelineId}
  }
}
```

### Articles by game-specific sections
```ts
// Fetch available sections for current game
const sections = await attributeService.fetchSections('article')
// WuWa: [{ slug: 'theory', label: 'Theory' }, { slug: 'lore', label: 'Lore' }, ...]
// Endfield: [{ slug: 'theory', ... }, { slug: 'field_report', label: 'Field Report' }, ...]

// Fetch articles filtered by section
const articles = await articleService.fetchAll('theory')
```
