ALTER TABLE public.social_posts 
ADD COLUMN IF NOT EXISTS series_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS series_position integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS post_type text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_series ON public.social_posts(series_id);