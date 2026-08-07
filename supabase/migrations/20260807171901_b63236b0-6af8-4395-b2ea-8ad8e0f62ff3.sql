DROP POLICY IF EXISTS "Authenticated read pro_price_tiers" ON public.pro_price_tiers;
CREATE POLICY "Pros and admins read pro_price_tiers"
ON public.pro_price_tiers
FOR SELECT
TO authenticated
USING (public.is_pro() OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated can read pro settings" ON public.pro_settings;
CREATE POLICY "Pros and admins read pro settings"
ON public.pro_settings
FOR SELECT
TO authenticated
USING (public.is_pro() OR public.is_admin());