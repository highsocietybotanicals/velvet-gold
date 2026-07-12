
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cbd_percentage text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS price_group text NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS is_force_noire boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS intention_match text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS taste_match text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terpenes jsonb NOT NULL DEFAULT '{"boise":50,"fruite":50,"epice":50,"terreux":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT products_price_group_chk CHECK (price_group IN ('A','B'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
