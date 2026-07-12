
DO $$ BEGIN
  CREATE POLICY "Public read product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins upload product-images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins update product-images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images' AND public.is_admin())
    WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins delete product-images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'product-images' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
