
-- Create social_posts table
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text,
  theme text,
  image_url text,
  caption text,
  status text NOT NULL DEFAULT 'draft',
  published_to text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create social-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('social-media', 'social-media', true);

CREATE POLICY "Admins can upload social media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-media' AND is_admin(auth.uid()));

CREATE POLICY "Anyone can view social media" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-media');

CREATE POLICY "Admins can delete social media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'social-media' AND is_admin(auth.uid()));
