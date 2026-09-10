DROP POLICY IF EXISTS "Pros and admins read pro settings" ON public.pro_settings;
CREATE POLICY "Pros, commercials and admins read pro settings"
ON public.pro_settings
FOR SELECT
TO authenticated
USING (public.is_pro() OR public.is_commercial() OR public.is_admin());

DROP POLICY IF EXISTS "Validated pros and admins can read pro_prices" ON public.pro_prices;
CREATE POLICY "Validated pros, commercials and admins can read pro_prices"
ON public.pro_prices
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.is_commercial()
  OR (
    public.is_pro()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_pro_validated = true
    )
  )
);