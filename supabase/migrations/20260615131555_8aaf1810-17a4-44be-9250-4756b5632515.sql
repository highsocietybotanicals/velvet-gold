ALTER TABLE public.products DROP COLUMN IF EXISTS pro_price;

GRANT SELECT ON public.pro_prices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pro_prices TO authenticated;
GRANT ALL ON public.pro_prices TO service_role;

DROP POLICY IF EXISTS "Admins can insert pro_prices" ON public.pro_prices;
CREATE POLICY "Admins can insert pro_prices" ON public.pro_prices FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update pro_prices" ON public.pro_prices;
CREATE POLICY "Admins can update pro_prices" ON public.pro_prices FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete pro_prices" ON public.pro_prices;
CREATE POLICY "Admins can delete pro_prices" ON public.pro_prices FOR DELETE TO authenticated USING (is_admin());