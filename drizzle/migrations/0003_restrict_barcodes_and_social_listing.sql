DROP POLICY IF EXISTS "Anyone can read barcodes" ON public.product_barcodes;
CREATE POLICY "Staff can read barcodes" ON public.product_barcodes FOR SELECT TO authenticated USING (public.is_admin() OR public.is_commercial());
DROP POLICY IF EXISTS "Anyone can view social media" ON storage.objects;
CREATE POLICY "Admins can list social media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'social-media' AND public.is_admin());