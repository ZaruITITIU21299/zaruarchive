-- =============================================================================
-- MIGRATION 002 — Flexible per-game attributes & section/category system
-- =============================================================================
-- Solves: adding a field to WuWa characters does not affect Endfield, and
-- vice versa. Each game defines its own attributes, sections, categories.
-- =============================================================================


-- ─── 1. GAME-SCOPED CONTENT SECTIONS ──────────────────────────────────────
-- Replaces hardcoded CHECK constraints on articles.section and terms.category.
-- Each game defines its own sections for articles and categories for terms.

CREATE TABLE public.game_sections (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id         text        NOT NULL REFERENCES public.games(id),
  entity_type     text        NOT NULL CHECK (entity_type IN ('article','term')),
  slug            text        NOT NULL,     -- e.g. 'theory', 'lore', 'field_report'
  icon            text,                     -- optional icon name
  display_order   integer     NOT NULL DEFAULT 0,

  CONSTRAINT game_sections_uniq UNIQUE (game_id, entity_type, slug)
);

CREATE TABLE public.game_section_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id      bigint      NOT NULL REFERENCES public.game_sections(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  label           text        NOT NULL,     -- e.g. 'Theory', 'Field Report'
  description     text,

  CONSTRAINT game_section_trans_uniq UNIQUE (section_id, lang)
);

-- Seed WuWa article sections
INSERT INTO public.game_sections (game_id, entity_type, slug, icon, display_order) VALUES
  ('wuwa', 'article', 'theory',          'lightbulb',    1),
  ('wuwa', 'article', 'lore',            'auto_stories', 2),
  ('wuwa', 'article', 'guide',           'school',       3),
  ('wuwa', 'article', 'event_log',       'event_note',   4),
  ('wuwa', 'article', 'character_study', 'person_search',5);

-- Seed Endfield article sections
INSERT INTO public.game_sections (game_id, entity_type, slug, icon, display_order) VALUES
  ('endfield', 'article', 'theory',             'lightbulb',    1),
  ('endfield', 'article', 'lore',               'auto_stories', 2),
  ('endfield', 'article', 'guide',              'school',       3),
  ('endfield', 'article', 'field_report',       'summarize',    4),
  ('endfield', 'article', 'intelligence_brief', 'encrypted',    5);

-- Seed WuWa term categories
INSERT INTO public.game_sections (game_id, entity_type, slug, icon, display_order) VALUES
  ('wuwa', 'term', 'technology', NULL, 1),
  ('wuwa', 'term', 'medical',    NULL, 2),
  ('wuwa', 'term', 'location',   NULL, 3),
  ('wuwa', 'term', 'species',    NULL, 4),
  ('wuwa', 'term', 'law',        NULL, 5),
  ('wuwa', 'term', 'faction',    NULL, 6),
  ('wuwa', 'term', 'event',      NULL, 7),
  ('wuwa', 'term', 'general',    NULL, 8);

-- Seed Endfield term categories
INSERT INTO public.game_sections (game_id, entity_type, slug, icon, display_order) VALUES
  ('endfield', 'term', 'originium',   NULL, 1),
  ('endfield', 'term', 'technology',  NULL, 2),
  ('endfield', 'term', 'location',    NULL, 3),
  ('endfield', 'term', 'race',        NULL, 4),
  ('endfield', 'term', 'faction',     NULL, 5),
  ('endfield', 'term', 'general',     NULL, 6);


-- Drop old CHECK constraints (articles.section, terms.category)
-- These are now validated at app level via game_sections lookup.
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_section_check;
ALTER TABLE public.terms    DROP CONSTRAINT IF EXISTS terms_category_check;


-- ─── 2. FLEXIBLE ATTRIBUTE DEFINITIONS ────────────────────────────────────
-- Each game defines custom attributes per entity type (character, article, etc).
-- WuWa characters: "Forte", "Resonance Skill", etc.
-- Endfield characters: "Race", "Class", "Originium Arts", etc.

CREATE TABLE public.attribute_definitions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  game_id         text        NOT NULL REFERENCES public.games(id),
  entity_type     text        NOT NULL CHECK (entity_type IN (
                    'character','article','term','timeline','event'
                  )),
  slug            text        NOT NULL,     -- e.g. 'forte', 'race', 'class'
  data_type       text        NOT NULL DEFAULT 'text'
                    CHECK (data_type IN ('text','number','boolean','select')),
  is_required     boolean     NOT NULL DEFAULT false,
  is_filterable   boolean     NOT NULL DEFAULT false,
  select_options  jsonb,                    -- for 'select' type: ["Broadblade","Sword","Pistols"]
  display_order   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT attribute_definitions_pkey PRIMARY KEY (id),
  CONSTRAINT attribute_definitions_uniq UNIQUE (game_id, entity_type, slug)
);

CREATE TABLE public.attribute_definition_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  definition_id   uuid        NOT NULL REFERENCES public.attribute_definitions(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  label           text        NOT NULL,     -- display name: 'Forte', 'Race'
  description     text,                     -- helper text / tooltip

  CONSTRAINT attr_def_trans_uniq UNIQUE (definition_id, lang)
);

-- Seed WuWa character attributes
INSERT INTO public.attribute_definitions (game_id, entity_type, slug, data_type, is_filterable, display_order) VALUES
  ('wuwa', 'character', 'forte',            'text',   false, 1),
  ('wuwa', 'character', 'resonance_chain',  'text',   false, 2),
  ('wuwa', 'character', 'birthplace',       'text',   true,  3);

-- Seed Endfield character attributes
INSERT INTO public.attribute_definitions (game_id, entity_type, slug, data_type, is_filterable, display_order) VALUES
  ('endfield', 'character', 'race',            'select', true,  1),
  ('endfield', 'character', 'class',           'select', true,  2),
  ('endfield', 'character', 'originium_arts',  'text',   false, 3),
  ('endfield', 'character', 'affiliation',     'text',   true,  4);


-- ─── 3. ENTITY ATTRIBUTE VALUES ───────────────────────────────────────────
-- Stores actual values. entity_type + entity_id is a polymorphic FK.
-- Translated via entity_attribute_translations.

CREATE TABLE public.entity_attributes (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  definition_id   uuid        NOT NULL REFERENCES public.attribute_definitions(id) ON DELETE CASCADE,
  entity_type     text        NOT NULL,
  entity_id       text        NOT NULL,     -- UUID or bigint cast to text
  value_number    numeric,                  -- for 'number' type
  value_boolean   boolean,                  -- for 'boolean' type
  value_select    text,                     -- for 'select' type (one of select_options)

  CONSTRAINT entity_attributes_uniq UNIQUE (definition_id, entity_id)
);

CREATE INDEX idx_entity_attrs_entity ON public.entity_attributes(entity_type, entity_id);
CREATE INDEX idx_entity_attrs_def    ON public.entity_attributes(definition_id);

CREATE TABLE public.entity_attribute_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attribute_id    bigint      NOT NULL REFERENCES public.entity_attributes(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  value           text        NOT NULL,     -- translated text value

  CONSTRAINT entity_attr_trans_uniq UNIQUE (attribute_id, lang)
);


-- ─── 4. TIMELINE: ADD parent_timeline_id FOR BREADCRUMB NAVIGATION ───────
-- child_timeline_id on events already handles the parent→child link.
-- This optional column on timelines makes it easy to show "Back to parent".

ALTER TABLE public.timelines
  ADD COLUMN parent_timeline_id bigint REFERENCES public.timelines(id);

CREATE INDEX idx_timelines_parent ON public.timelines(parent_timeline_id)
  WHERE parent_timeline_id IS NOT NULL;


-- ─── 5. REMOVE forte FROM character_translations ──────────────────────────
-- It's now handled by the flexible attribute system.
-- Keep the column but mark as deprecated; drop in a future migration.

COMMENT ON COLUMN public.character_translations.forte IS
  'DEPRECATED: Use attribute_definitions + entity_attributes instead. Kept for backward compatibility.';
