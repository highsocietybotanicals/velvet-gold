
-- Drop the overbroad PERMISSIVE FOR ALL policies
DROP POLICY IF EXISTS "Require authentication for orders access" ON public.orders;
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- Recreate as RESTRICTIVE to act as an auth gate without overriding user-scoped policies
CREATE POLICY "Require auth for orders" ON public.orders
  AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Require auth for profiles" ON public.profiles
  AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
