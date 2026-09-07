ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lab_report_path text;

CREATE POLICY "Admins can upload lab reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lab-reports' AND public.is_admin());

CREATE POLICY "Admins can update lab reports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lab-reports' AND public.is_admin());

CREATE POLICY "Admins can delete lab reports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lab-reports' AND public.is_admin());

CREATE POLICY "Staff and pros can read lab reports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'lab-reports'
  AND (public.is_admin() OR public.is_commercial() OR public.is_pro())
);
