CREATE POLICY "Admins can insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));