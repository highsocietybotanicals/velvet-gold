
-- Fix orders INSERT: allow admins to insert any order, regular users must have user_id
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL)
    OR public.is_admin()
  );

-- Fix order_items INSERT: allow admins to insert items for any order
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
        AND orders.user_id IS NOT NULL
    )
    OR public.is_admin()
  );
