
ALTER TABLE public.product_reviews
  ADD COLUMN user_id uuid REFERENCES auth.users(id),
  ADD COLUMN status text NOT NULL DEFAULT 'approved',
  ADD COLUMN order_id uuid;

-- Drop old policy
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.product_reviews;

-- Only approved reviews visible publicly
CREATE POLICY "Anyone can read approved reviews"
  ON public.product_reviews FOR SELECT USING (status = 'approved');

-- Admins can read all reviews (including pending)
CREATE POLICY "Admins can read all reviews"
  ON public.product_reviews FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Authenticated users can submit reviews
CREATE POLICY "Authenticated users can submit reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can update (approve/reject)
CREATE POLICY "Admins can update reviews"
  ON public.product_reviews FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Admin can delete
CREATE POLICY "Admins can delete reviews"
  ON public.product_reviews FOR DELETE TO authenticated USING (is_admin(auth.uid()));
