
-- ==========================================
-- FIX: orders table - drop overbroad RESTRICTIVE ALL policy
-- Convert user/admin policies to PERMISSIVE for correct OR logic
-- ==========================================
DROP POLICY IF EXISTS "Require auth for orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own orders" ON public.orders
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all orders" ON public.orders
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete orders" ON public.orders
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- FIX: profiles table - drop overbroad RESTRICTIVE ALL policy
-- Convert to PERMISSIVE
-- ==========================================
DROP POLICY IF EXISTS "Require auth for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

-- ==========================================
-- FIX: order_items table - convert to PERMISSIVE
-- ==========================================
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Only admins can delete order items" ON public.order_items;

CREATE POLICY "Users can view own order items" ON public.order_items
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all order items" ON public.order_items
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert own order items" ON public.order_items
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Only admins can delete order items" ON public.order_items
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));
