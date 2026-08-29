DROP POLICY IF EXISTS "Validated pros and admins read pro_price_tiers" ON public.pro_price_tiers;
CREATE POLICY "Validated pros, commercials and admins read pro_price_tiers"
ON public.pro_price_tiers
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.is_commercial()
  OR (public.is_pro() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_pro_validated = true
  ))
);