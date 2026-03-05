-- =============================================================================
-- ZARU ARCHIVE — Multi-Game Database Schema
-- =============================================================================
-- Supabase / PostgreSQL
--
-- Design principles:
--   1. Multi-game via `game_id` FK on every content table
--   2. Unified i18n via *_translations tables (no _en/_vi column pairs)
--   3. Images stored in Supabase Storage bucket `game-assets`, DB holds path only
--   4. Game-specific sections (Tacet Discord, etc.) folded into `articles.section`
--   5. Soft deletes, audit trail, status on all content
--   6. Polymorphic tagging system
-- =============================================================================

-- ─── GAMES ──────────────────────────────────────────────────────────────────
-- Central registry. Each row = one supported game in the archive.

CREATE TABLE public.games (
  id          text        NOT NULL,                    -- e.g. 'wuwa', 'endfield'
  name        text        NOT NULL,                    -- 'Wuthering Waves'
  slug        text        NOT NULL UNIQUE,             -- URL-safe identifier
  icon        text,                                    -- Material Symbol name
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT games_pkey PRIMARY KEY (id)
);

-- Seed the two launch games
INSERT INTO public.games (id, name, slug, icon) VALUES
  ('wuwa',     'Wuthering Waves',     'wuthering-waves',     'waves'),
  ('endfield', 'Arknights: Endfield', 'arknights-endfield',  'shield');


-- ─── CHARACTERS ─────────────────────────────────────────────────────────────

CREATE TABLE public.characters (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  game_id         text        NOT NULL REFERENCES public.games(id),
  image_path      text,                                -- Supabase Storage path
  element         text,                                -- e.g. 'Spectro', 'Havoc'
  weapon          text,                                -- e.g. 'Broadblade'
  rarity          smallint,                            -- e.g. 4, 5
  faction         text,
  display_order   integer     NOT NULL DEFAULT 0,
  is_featured     boolean     NOT NULL DEFAULT false,
  status          text        NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','published','archived')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id),
  updated_by      uuid        REFERENCES auth.users(id),
  deleted_at      timestamptz,

  CONSTRAINT characters_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_characters_game       ON public.characters(game_id);
CREATE INDEX idx_characters_status     ON public.characters(game_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_characters_featured   ON public.characters(game_id, is_featured) WHERE is_featured = true;

CREATE TABLE public.character_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  character_id    uuid        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  name            text        NOT NULL,
  alias           text,
  title           text,                                -- e.g. 'Magistrate of Jinzhou'
  summary         text,
  backstory       text,
  forte           text,

  CONSTRAINT character_translations_uniq UNIQUE (character_id, lang)
);

CREATE INDEX idx_char_trans_lookup ON public.character_translations(character_id, lang);


-- ─── TIMELINES ──────────────────────────────────────────────────────────────

CREATE TABLE public.timelines (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id         text        NOT NULL REFERENCES public.games(id),
  cover_path      text,                                -- Supabase Storage path
  display_order   integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','published','archived')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id),
  updated_by      uuid        REFERENCES auth.users(id),
  deleted_at      timestamptz,

  CONSTRAINT timelines_game_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);

CREATE INDEX idx_timelines_game ON public.timelines(game_id) WHERE deleted_at IS NULL;

CREATE TABLE public.timeline_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  timeline_id     bigint      NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  title           text        NOT NULL,
  description     text,

  CONSTRAINT timeline_translations_uniq UNIQUE (timeline_id, lang)
);


-- ─── EVENTS (belong to a timeline) ─────────────────────────────────────────

CREATE TABLE public.events (
  id                  bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  timeline_id         bigint      NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  image_path          text,
  position            integer     NOT NULL DEFAULT 0,
  child_timeline_id   bigint      REFERENCES public.timelines(id),
  status              text        NOT NULL DEFAULT 'published'
                        CHECK (status IN ('draft','published','archived')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid        REFERENCES auth.users(id),
  updated_by          uuid        REFERENCES auth.users(id),
  deleted_at          timestamptz
);

CREATE INDEX idx_events_timeline   ON public.events(timeline_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_child      ON public.events(child_timeline_id) WHERE child_timeline_id IS NOT NULL;

CREATE TABLE public.event_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        bigint      NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  title           text        NOT NULL,
  description     text,
  time_label      text,                                -- display label like 'Year 1024'

  CONSTRAINT event_translations_uniq UNIQUE (event_id, lang)
);


-- ─── TERMINOLOGY ────────────────────────────────────────────────────────────

CREATE TABLE public.terms (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  game_id         text        NOT NULL REFERENCES public.games(id),
  category        text        NOT NULL DEFAULT 'general'
                    CHECK (category IN (
                      'technology','medical','location','species',
                      'law','event','entity','faction','general'
                    )),
  related_terms   uuid[],                              -- array of term IDs
  display_order   integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','published','archived')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id),
  updated_by      uuid        REFERENCES auth.users(id),
  deleted_at      timestamptz,

  CONSTRAINT terms_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_terms_game     ON public.terms(game_id, category) WHERE deleted_at IS NULL;

CREATE TABLE public.term_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  term_id         uuid        NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  term            text        NOT NULL,                -- the word/phrase
  definition      text        NOT NULL,

  CONSTRAINT term_translations_uniq UNIQUE (term_id, lang)
);


-- ─── ARTICLES ───────────────────────────────────────────────────────────────
-- Unified table for: theories, event logs, character studies, tacet discord, etc.
-- The `section` column maps directly to frontend routes / nav sections.

CREATE TABLE public.articles (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  game_id         text        NOT NULL REFERENCES public.games(id),
  section         text        NOT NULL DEFAULT 'theory'
                    CHECK (section IN (
                      'theory','event_log','character_study','tacet_discord','guide','general'
                    )),
  image_path      text,                                -- hero/cover image
  read_time_min   smallint,                            -- estimated reading time
  is_featured     boolean     NOT NULL DEFAULT false,
  related_character_id uuid   REFERENCES public.characters(id),
  display_order   integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft','published','archived')),
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id),
  updated_by      uuid        REFERENCES auth.users(id),
  deleted_at      timestamptz,

  CONSTRAINT articles_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_articles_game_section ON public.articles(game_id, section, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_articles_featured     ON public.articles(game_id, is_featured)
  WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_articles_published    ON public.articles(game_id, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE TABLE public.article_translations (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id      uuid        NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  lang            text        NOT NULL CHECK (char_length(lang) = 2),
  title           text        NOT NULL,
  summary         text,
  content         text,                                -- full body (markdown or rich text)

  CONSTRAINT article_translations_uniq UNIQUE (article_id, lang)
);


-- ─── TAGS ───────────────────────────────────────────────────────────────────
-- Reusable, game-scoped tags with polymorphic linking.

CREATE TABLE public.tags (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  game_id     text    NOT NULL REFERENCES public.games(id),
  slug        text    NOT NULL,                        -- URL-safe e.g. 'cataclysm'
  label       text    NOT NULL,                        -- display label '#Cataclysm'
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_game_slug_uniq UNIQUE (game_id, slug)
);

CREATE TABLE public.content_tags (
  tag_id          uuid    NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type     text    NOT NULL CHECK (entity_type IN (
                    'character','event','article','term','timeline'
                  )),
  entity_id       text    NOT NULL,                    -- UUID or bigint cast to text

  CONSTRAINT content_tags_pkey PRIMARY KEY (tag_id, entity_type, entity_id)
);

CREATE INDEX idx_content_tags_entity ON public.content_tags(entity_type, entity_id);


-- ─── CROSS-ENTITY RELATIONSHIPS ─────────────────────────────────────────────

CREATE TABLE public.character_events (
  character_id    uuid    NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  event_id        bigint  NOT NULL REFERENCES public.events(id)    ON DELETE CASCADE,
  role            text    DEFAULT 'mentioned'
                    CHECK (role IN ('protagonist','participant','mentioned','antagonist')),

  CONSTRAINT character_events_pkey PRIMARY KEY (character_id, event_id)
);

CREATE TABLE public.related_characters (
  character_a     uuid    NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_b     uuid    NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  relationship    text,                                -- 'ally', 'rival', 'mentor', etc.

  CONSTRAINT related_characters_pkey PRIMARY KEY (character_a, character_b),
  CONSTRAINT related_characters_no_self CHECK (character_a <> character_b)
);


-- ─── HELPER: updated_at trigger ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_characters_updated  BEFORE UPDATE ON public.characters  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_terms_updated       BEFORE UPDATE ON public.terms       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_articles_updated    BEFORE UPDATE ON public.articles    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── SUPABASE STORAGE BUCKET ────────────────────────────────────────────────
-- Run this via Supabase Dashboard or management API, not raw SQL.
-- Bucket: game-assets (public)
--
-- Folder structure:
--   game-assets/
--   ├── wuwa/
--   │   ├── characters/{uuid}.webp
--   │   ├── timelines/{id}-cover.webp
--   │   ├── events/{id}.webp
--   │   └── articles/{uuid}.webp
--   └── endfield/
--       ├── characters/{uuid}.webp
--       └── ...
--
-- In the app, store only the path after the bucket name:
--   image_path = 'wuwa/characters/abc123.webp'
--
-- Generate public URL via:
--   supabase.storage.from('game-assets').getPublicUrl(image_path)
-- =============================================================================
