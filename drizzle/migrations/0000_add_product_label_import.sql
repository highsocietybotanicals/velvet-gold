ALTER TABLE public.products ADD COLUMN IF NOT EXISTS label_image_path text;

CREATE POLICY "Admins manage product labels"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-labels' AND public.is_admin())
WITH CHECK (bucket_id = 'product-labels' AND public.is_admin());

CREATE POLICY "Staff read product labels"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-labels' AND (public.is_admin() OR public.is_commercial()));