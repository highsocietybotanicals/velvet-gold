CREATE TABLE public.product_lab_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_lab_reports_product ON public.product_lab_reports(product_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_lab_reports TO authenticated;
GRANT ALL ON public.product_lab_reports TO service_role;

ALTER TABLE public.product_lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab reports readable by admin, commercial and validated pro"
ON public.product_lab_reports FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.is_commercial()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_pro_validated = true
  )
);

CREATE POLICY "Admins can insert lab reports"
ON public.product_lab_reports FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lab reports"
ON public.product_lab_reports FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete lab reports"
ON public.product_lab_reports FOR DELETE TO authenticated
USING (public.is_admin());

INSERT INTO public.product_lab_reports (product_id, label, storage_path)
SELECT id, 'Analyse laboratoire', lab_report_path
FROM public.products
WHERE lab_report_path IS NOT NULL;