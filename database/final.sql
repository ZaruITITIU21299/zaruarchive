-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.article_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  article_id uuid NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  title text NOT NULL,
  summary text,
  content text,
  CONSTRAINT article_translations_pkey PRIMARY KEY (id),
  CONSTRAINT article_translations_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  section text NOT NULL DEFAULT 'theory'::text,
  image_path text,
  read_time_min smallint,
  is_featured boolean NOT NULL DEFAULT false,
  related_character_id uuid,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT articles_related_character_id_fkey FOREIGN KEY (related_character_id) REFERENCES public.characters(id),
  CONSTRAINT articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT articles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.attribute_definition_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  definition_id uuid NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  label text NOT NULL,
  description text,
  CONSTRAINT attribute_definition_translations_pkey PRIMARY KEY (id),
  CONSTRAINT attribute_definition_translations_definition_id_fkey FOREIGN KEY (definition_id) REFERENCES public.attribute_definitions(id)
);
CREATE TABLE public.attribute_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['character'::text, 'article'::text, 'term'::text, 'timeline'::text, 'event'::text])),
  slug text NOT NULL,
  data_type text NOT NULL DEFAULT 'text'::text CHECK (data_type = ANY (ARRAY['text'::text, 'number'::text, 'boolean'::text, 'select'::text])),
  is_required boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT false,
  select_options jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attribute_definitions_pkey PRIMARY KEY (id),
  CONSTRAINT attribute_definitions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.character_events (
  character_id uuid NOT NULL,
  event_id bigint NOT NULL,
  role text DEFAULT 'mentioned'::text CHECK (role = ANY (ARRAY['protagonist'::text, 'participant'::text, 'mentioned'::text, 'antagonist'::text])),
  CONSTRAINT character_events_pkey PRIMARY KEY (character_id, event_id),
  CONSTRAINT character_events_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT character_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.character_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  character_id uuid NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  name text NOT NULL,
  alias text,
  title text,
  summary text,
  backstory text,
  CONSTRAINT character_translations_pkey PRIMARY KEY (id),
  CONSTRAINT character_translations_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.characters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  image_path text,
  element text,
  weapon text,
  rarity smallint,
  faction text,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  CONSTRAINT characters_pkey PRIMARY KEY (id),
  CONSTRAINT characters_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT characters_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT characters_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.content_tags (
  tag_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['character'::text, 'event'::text, 'article'::text, 'term'::text, 'timeline'::text])),
  entity_id text NOT NULL,
  CONSTRAINT content_tags_pkey PRIMARY KEY (tag_id, entity_type, entity_id),
  CONSTRAINT content_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.entity_attribute_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  attribute_id bigint NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  value text NOT NULL,
  CONSTRAINT entity_attribute_translations_pkey PRIMARY KEY (id),
  CONSTRAINT entity_attribute_translations_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.entity_attributes(id)
);
CREATE TABLE public.entity_attributes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  definition_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  value_number numeric,
  value_boolean boolean,
  value_select text,
  CONSTRAINT entity_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT entity_attributes_definition_id_fkey FOREIGN KEY (definition_id) REFERENCES public.attribute_definitions(id)
);
CREATE TABLE public.event_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id bigint NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  title text NOT NULL,
  description text,
  time_label text,
  CONSTRAINT event_translations_pkey PRIMARY KEY (id),
  CONSTRAINT event_translations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  timeline_id bigint NOT NULL,
  image_path text,
  position integer NOT NULL DEFAULT 0,
  child_timeline_id bigint,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_timeline_id_fkey FOREIGN KEY (timeline_id) REFERENCES public.timelines(id),
  CONSTRAINT events_child_timeline_id_fkey FOREIGN KEY (child_timeline_id) REFERENCES public.timelines(id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT events_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.game_section_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  section_id bigint NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  label text NOT NULL,
  description text,
  CONSTRAINT game_section_translations_pkey PRIMARY KEY (id),
  CONSTRAINT game_section_translations_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.game_sections(id)
);
CREATE TABLE public.game_sections (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  game_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['article'::text, 'term'::text])),
  slug text NOT NULL,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  CONSTRAINT game_sections_pkey PRIMARY KEY (id),
  CONSTRAINT game_sections_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.games (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (id)
);
CREATE TABLE public.related_characters (
  character_a uuid NOT NULL,
  character_b uuid NOT NULL,
  relationship text,
  CONSTRAINT related_characters_pkey PRIMARY KEY (character_a, character_b),
  CONSTRAINT related_characters_character_a_fkey FOREIGN KEY (character_a) REFERENCES public.characters(id),
  CONSTRAINT related_characters_character_b_fkey FOREIGN KEY (character_b) REFERENCES public.characters(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.term_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  term_id uuid NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  term text NOT NULL,
  definition text NOT NULL,
  CONSTRAINT term_translations_pkey PRIMARY KEY (id),
  CONSTRAINT term_translations_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id)
);
CREATE TABLE public.terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  category text NOT NULL DEFAULT 'general'::text,
  related_terms ARRAY,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  CONSTRAINT terms_pkey PRIMARY KEY (id),
  CONSTRAINT terms_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT terms_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT terms_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.timeline_translations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  timeline_id bigint NOT NULL,
  lang text NOT NULL CHECK (char_length(lang) = 2),
  title text NOT NULL,
  description text,
  CONSTRAINT timeline_translations_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_translations_timeline_id_fkey FOREIGN KEY (timeline_id) REFERENCES public.timelines(id)
);
CREATE TABLE public.timelines (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  game_id text NOT NULL,
  cover_path text,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  parent_timeline_id bigint,
  CONSTRAINT timelines_pkey PRIMARY KEY (id),
  CONSTRAINT timelines_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT timelines_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT timelines_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT timelines_game_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT timelines_parent_timeline_id_fkey FOREIGN KEY (parent_timeline_id) REFERENCES public.timelines(id)
);