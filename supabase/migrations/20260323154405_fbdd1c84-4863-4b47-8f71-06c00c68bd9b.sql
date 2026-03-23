DROP POLICY "Authenticated users can submit reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');