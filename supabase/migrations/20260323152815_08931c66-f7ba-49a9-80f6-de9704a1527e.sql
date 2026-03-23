CREATE POLICY "Admins can view all promo usage"
  ON public.promo_code_usage FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));